"use server";

import { promises as dns } from "dns";
import { createClient } from "@/lib/supabase/server";
import type {
  CampaignStatus,
  EmailValidationStatus,
  LeadActivityEventType,
  LeadStatus,
  Json,
} from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

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

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  closed: "Closed",
};

interface Session {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  userId: string;
}

async function requireSession(): Promise<Session> {
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

  return {
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
  };
}

async function logActivity(
  supabase: SupabaseClient<Database>,
  params: {
    leadId: string;
    organizationId: string;
    actorId: string | null;
    eventType: LeadActivityEventType;
    message: string;
    metadata?: Json;
  }
): Promise<void> {
  await supabase.from("lead_activity_events").insert({
    lead_id: params.leadId,
    organization_id: params.organizationId,
    actor_id: params.actorId,
    event_type: params.eventType,
    message: params.message,
    metadata: params.metadata ?? {},
  });
}

export async function deleteLeads(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { supabase, organizationId } = await requireSession();

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
  const { supabase, organizationId } = await requireSession();

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

/** Single-lead re-validate, used by the Lead Detail view's "Re-validate"
 * button — same classifier as the bulk action, logged to the activity
 * timeline since it's a user-initiated action on one specific lead. */
export async function revalidateLeadEmail(
  leadId: string
): Promise<{ status: EmailValidationStatus }> {
  const { supabase, organizationId, userId } = await requireSession();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, email")
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .maybeSingle();
  if (error || !lead) throw new Error("Lead not found.");
  if (!lead.email) throw new Error("This lead has no email to validate.");

  const status = await classifyEmail(lead.email);

  const { error: updateError } = await supabase
    .from("leads")
    .update({ email_validation_status: status })
    .eq("id", leadId);
  if (updateError) throw new Error(`Couldn't save: ${updateError.message}`);

  await logActivity(supabase, {
    leadId,
    organizationId,
    actorId: userId,
    eventType: "email_validated",
    message: `Email re-validated: ${status}`,
  });

  return { status };
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<void> {
  const { supabase, organizationId, userId } = await requireSession();

  const { data: existing } = await supabase
    .from("leads")
    .select("status")
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .maybeSingle();
  if (!existing) throw new Error("Lead not found.");
  if (existing.status === status) return;

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);
  if (error) throw new Error(`Couldn't update status: ${error.message}`);

  await logActivity(supabase, {
    leadId,
    organizationId,
    actorId: userId,
    eventType: "status_changed",
    message: `Status changed from ${STATUS_LABELS[existing.status]} to ${STATUS_LABELS[status]}`,
    metadata: { from: existing.status, to: status },
  });
}

export interface LeadNote {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  const { supabase, organizationId } = await requireSession();

  const { data, error } = await supabase
    .from("lead_notes")
    .select("id, body, created_at, updated_at")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load notes: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function addLeadNote(
  leadId: string,
  body: string
): Promise<LeadNote> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("A note can't be empty.");
  const { supabase, organizationId, userId } = await requireSession();

  const { data, error } = await supabase
    .from("lead_notes")
    .insert({
      lead_id: leadId,
      organization_id: organizationId,
      created_by: userId,
      body: trimmed,
    })
    .select("id, body, created_at, updated_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Couldn't save note.");

  await logActivity(supabase, {
    leadId,
    organizationId,
    actorId: userId,
    eventType: "note_added",
    message: `Note added: "${truncate(trimmed)}"`,
  });

  return {
    id: data.id,
    body: data.body,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateLeadNote(
  noteId: string,
  leadId: string,
  body: string
): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("A note can't be empty.");
  const { supabase, organizationId, userId } = await requireSession();

  const { error } = await supabase
    .from("lead_notes")
    .update({ body: trimmed })
    .eq("id", noteId)
    .eq("organization_id", organizationId);
  if (error) throw new Error(`Couldn't save note: ${error.message}`);

  await logActivity(supabase, {
    leadId,
    organizationId,
    actorId: userId,
    eventType: "note_updated",
    message: `Note updated: "${truncate(trimmed)}"`,
  });
}

export async function deleteLeadNote(
  noteId: string,
  leadId: string
): Promise<void> {
  const { supabase, organizationId, userId } = await requireSession();

  const { error } = await supabase
    .from("lead_notes")
    .delete()
    .eq("id", noteId)
    .eq("organization_id", organizationId);
  if (error) throw new Error(`Couldn't delete note: ${error.message}`);

  await logActivity(supabase, {
    leadId,
    organizationId,
    actorId: userId,
    eventType: "note_deleted",
    message: "Note deleted",
  });
}

export interface LeadActivityEvent {
  id: string;
  eventType: LeadActivityEventType;
  message: string;
  createdAt: string;
}

export async function getLeadActivity(
  leadId: string
): Promise<LeadActivityEvent[]> {
  const { supabase, organizationId } = await requireSession();

  const { data, error } = await supabase
    .from("lead_activity_events")
    .select("id, event_type, message, created_at")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load activity: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    message: row.message,
    createdAt: row.created_at,
  }));
}

export interface OrgCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
}

export async function listOrgCampaigns(): Promise<OrgCampaign[]> {
  const { supabase, organizationId } = await requireSession();

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
  const { supabase, organizationId, userId } = await requireSession();

  let campaignId = input.campaignId;
  let campaignName: string;

  if (!campaignId) {
    const name = input.newCampaignName?.trim();
    if (!name) throw new Error("Enter a name for the new campaign.");

    const { data: campaign, error: createError } = await supabase
      .from("campaigns")
      .insert({
        organization_id: organizationId,
        created_by: userId,
        name,
        status: "draft",
      })
      .select("id, name")
      .single();

    if (createError || !campaign) {
      throw new Error(createError?.message ?? "Couldn't create the campaign.");
    }
    campaignId = campaign.id;
    campaignName = campaign.name;
  } else {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("name")
      .eq("id", campaignId)
      .maybeSingle();
    campaignName = campaign?.name ?? "campaign";
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

  await Promise.all(
    leadIds.map((leadId) =>
      logActivity(supabase, {
        leadId,
        organizationId,
        actorId: userId,
        eventType: "added_to_campaign",
        message: `Added to campaign: ${campaignName}`,
      })
    )
  );

  return { campaignId, addedCount: rows.length };
}

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
