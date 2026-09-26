"use server";

import { promises as dns } from "dns";
import { createClient } from "@/lib/supabase/server";
import type {
  CampaignStatus,
  EmailValidationStatus,
} from "@/lib/types/database.types";

const EMAIL_LOOKUP_CONCURRENCY = 5;
const EMAIL_FORMAT_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Generic inbox addresses are real, deliverable mailboxes but a poor bet
// for cold outreach — flagged "risky" rather than "valid", same distinction
// most email-verification tools make.
const ROLE_BASED_LOCAL_PARTS = new Set([
  "info",
  "admin",
  "support",
  "sales",
  "contact",
  "office",
  "hello",
  "noreply",
  "no-reply",
  "help",
]);

async function requireOrganizationId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("No organization found for your account.");

  return membership.organization_id;
}

export async function deleteLeads(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const organizationId = await requireOrganizationId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("organization_id", organizationId)
    .in("id", ids);

  if (error) {
    throw new Error(`Couldn't delete: ${error.message}`);
  }
}

/**
 * Real, no-third-party-API email validation: format check, then an MX
 * lookup on the domain (a domain with no mail servers can't receive mail
 * regardless of what's before the @). This can't confirm a specific mailbox
 * exists — that needs an SMTP handshake, which most mail servers block or
 * lie to for unknown senders — so it's a genuine but bounded signal, not a
 * guarantee, and role-based addresses are downgraded to "risky" rather than
 * called invalid or fully valid.
 */
async function classifyEmail(email: string): Promise<EmailValidationStatus> {
  if (!EMAIL_FORMAT_REGEX.test(email)) return "invalid";

  const domain = email.split("@")[1];
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) return "invalid";
  } catch {
    return "invalid";
  }

  const localPart = email.split("@")[0].toLowerCase();
  if (ROLE_BASED_LOCAL_PARTS.has(localPart)) return "risky";
  return "valid";
}

export async function validateLeadEmails(
  ids: string[]
): Promise<{ checked: number }> {
  if (ids.length === 0) return { checked: 0 };
  const organizationId = await requireOrganizationId();
  const supabase = await createClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, email")
    .eq("organization_id", organizationId)
    .in("id", ids);
  if (error) throw new Error(`Couldn't load leads: ${error.message}`);

  const withEmail = (leads ?? []).filter(
    (lead): lead is { id: string; email: string } => !!lead.email
  );

  let checked = 0;
  for (let i = 0; i < withEmail.length; i += EMAIL_LOOKUP_CONCURRENCY) {
    const batch = withEmail.slice(i, i + EMAIL_LOOKUP_CONCURRENCY);
    await Promise.all(
      batch.map(async (lead) => {
        const status = await classifyEmail(lead.email);
        await supabase
          .from("leads")
          .update({ email_validation_status: status })
          .eq("id", lead.id);
        checked++;
      })
    );
  }

  return { checked };
}

export interface OrgCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
}

export async function listOrgCampaigns(): Promise<OrgCampaign[]> {
  const organizationId = await requireOrganizationId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, status")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Couldn't load campaigns: ${error.message}`);
  return data ?? [];
}

export interface AddToCampaignInput {
  campaignId?: string;
  newCampaignName?: string;
}

export async function addLeadsToCampaign(
  leadIds: string[],
  input: AddToCampaignInput
): Promise<{ campaignId: string; addedCount: number }> {
  if (leadIds.length === 0) throw new Error("No leads selected.");
  const organizationId = await requireOrganizationId();
  const supabase = await createClient();

  let campaignId = input.campaignId;

  if (!campaignId) {
    const name = input.newCampaignName?.trim();
    if (!name) throw new Error("Enter a name for the new campaign.");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: campaign, error: createError } = await supabase
      .from("campaigns")
      .insert({
        organization_id: organizationId,
        created_by: user?.id ?? null,
        name,
        status: "draft",
      })
      .select("id")
      .single();

    if (createError || !campaign) {
      throw new Error(createError?.message ?? "Couldn't create the campaign.");
    }
    campaignId = campaign.id;
  }

  const rows = leadIds.map((leadId) => ({
    campaign_id: campaignId as string,
    lead_id: leadId,
  }));

  const { error: upsertError } = await supabase
    .from("campaign_leads")
    .upsert(rows, {
      onConflict: "campaign_id,lead_id",
      ignoreDuplicates: true,
    });

  if (upsertError) {
    throw new Error(`Couldn't add leads to campaign: ${upsertError.message}`);
  }

  return { campaignId, addedCount: rows.length };
}
