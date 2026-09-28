"use server";

import { getQueue, QUEUE_NAMES } from "@/lib/queue";
import { createClient } from "@/lib/supabase/server";
import { getAnthropic } from "@/lib/anthropic";
import { renderTemplate } from "@/lib/merge-template";
import { sendCampaignEmail } from "@/lib/campaign-email-sender";
import { getEffectiveDailyLimit } from "@/lib/sender-warmup";
import type {
  CampaignStatus,
  EmailValidationStatus,
} from "@/lib/types/database.types";
import type { OpportunityScoreBreakdown } from "@/lib/types/domain";
import type { CampaignSendJobData } from "@/lib/jobs/campaign-send";

const DAY_MS = 24 * 60 * 60 * 1000;
const INTRA_DAY_SPACING_MS = 30_000;
const MAX_IMPORT_ROWS = 5000;

async function requireOrganizationId(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  userId: string;
}> {
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

export interface SenderAccountOption {
  id: string;
  emailAddress: string;
  dailySendLimit: number;
  sentToday: number;
}

export async function listSenderAccounts(): Promise<SenderAccountOption[]> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("sender_accounts")
    .select(
      "id, email_address, daily_send_limit, warmup_enabled, warmup_started_at"
    )
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Couldn't load sender accounts: ${error.message}`);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return Promise.all(
    (data ?? []).map(async (account) => {
      const { count } = await supabase
        .from("campaign_leads")
        .select("*, campaigns!inner(sender_account_id)", {
          count: "exact",
          head: true,
        })
        .eq("campaigns.sender_account_id", account.id)
        .gte("sent_at", startOfToday.toISOString());

      return {
        id: account.id,
        emailAddress: account.email_address,
        dailySendLimit: getEffectiveDailyLimit({
          dailySendLimit: account.daily_send_limit,
          warmupEnabled: account.warmup_enabled,
          warmupStartedAt: account.warmup_started_at,
        }),
        sentToday: count ?? 0,
      };
    })
  );
}

export interface CreateCampaignInput {
  name: string;
  senderAccountId?: string;
  scheduledAt?: string;
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name) throw new Error("Give the campaign a name.");
  const { supabase, organizationId, userId } = await requireOrganizationId();

  const status: CampaignStatus = input.scheduledAt ? "scheduled" : "draft";

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      organization_id: organizationId,
      created_by: userId,
      sender_account_id: input.senderAccountId || null,
      name,
      status,
      scheduled_at: input.scheduledAt || null,
    })
    .select("id")
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Couldn't create campaign.");
  return { id: data.id };
}

export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus
): Promise<void> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { error } = await supabase
    .from("campaigns")
    .update({ status })
    .eq("id", campaignId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(`Couldn't update campaign: ${error.message}`);
}

export async function duplicateCampaign(
  campaignId: string
): Promise<{ id: string }> {
  const { supabase, organizationId, userId } = await requireOrganizationId();

  const { data: original, error: fetchError } = await supabase
    .from("campaigns")
    .select("name, sender_account_id")
    .eq("id", campaignId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (fetchError || !original) throw new Error("Campaign not found.");

  const { data: copy, error: createError } = await supabase
    .from("campaigns")
    .insert({
      organization_id: organizationId,
      created_by: userId,
      sender_account_id: original.sender_account_id,
      name: `${original.name} (Copy)`,
      status: "draft",
    })
    .select("id")
    .single();
  if (createError || !copy) {
    throw new Error(createError?.message ?? "Couldn't duplicate campaign.");
  }

  // Copy the target lead list, not the send history — a duplicate is a
  // fresh run against the same recipients, so every row starts at
  // "queued" with no timestamps.
  const { data: leads } = await supabase
    .from("campaign_leads")
    .select("lead_id")
    .eq("campaign_id", campaignId);

  if (leads && leads.length > 0) {
    await supabase
      .from("campaign_leads")
      .insert(
        leads.map((lead) => ({ campaign_id: copy.id, lead_id: lead.lead_id }))
      );
  }

  return { id: copy.id };
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(`Couldn't delete campaign: ${error.message}`);
}

export interface WizardLeadSummary {
  id: string;
  name: string;
  category: string | null;
  email: string | null;
  emailValidationStatus: EmailValidationStatus;
  opportunityScoreBreakdown: OpportunityScoreBreakdown;
}

/** Full detail for the wizard's selected leads — the picker's paginated
 * list only carries lean columns, so Step 2's merge-variable preview and
 * Step 4's recipient eligibility both fetch this separately, once, for
 * just the selected ids. */
export async function getWizardLeadSummaries(
  leadIds: string[]
): Promise<WizardLeadSummary[]> {
  if (leadIds.length === 0) return [];
  const { supabase, organizationId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, name, category, email, email_validation_status, opportunity_score_breakdown"
    )
    .eq("organization_id", organizationId)
    .in("id", leadIds);
  if (error) throw new Error(`Couldn't load leads: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    email: row.email,
    emailValidationStatus: row.email_validation_status,
    opportunityScoreBreakdown:
      row.opportunity_score_breakdown as OpportunityScoreBreakdown,
  }));
}

export interface ImportedLeadInput {
  name: string;
  email: string | null;
  phone: string | null;
  category: string | null;
}

/** Step 1's Import tab — every path (CSV/Excel column-mapped rows, PDF-
 * extracted emails, or pasted lines) ends up here as plain rows, and
 * becomes a real lead the same way a search result would, since
 * campaign_leads.lead_id has to point at an actual leads row. */
export async function importLeadsFromRows(
  rows: ImportedLeadInput[]
): Promise<{ leadIds: string[] }> {
  const validRows = rows
    .filter((r) => r.name.trim().length > 0)
    .slice(0, MAX_IMPORT_ROWS);
  if (validRows.length === 0) return { leadIds: [] };
  const { supabase, organizationId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("leads")
    .insert(
      validRows.map((r) => ({
        organization_id: organizationId,
        name: r.name.trim(),
        email: r.email?.trim() || null,
        phone: r.phone?.trim() || null,
        category: r.category?.trim() || null,
      }))
    )
    .select("id");

  if (error) throw new Error(`Couldn't import leads: ${error.message}`);
  return { leadIds: (data ?? []).map((row) => row.id) };
}

export interface GenerateTemplateInput {
  offerDescription: string;
}

export interface GeneratedTemplate {
  subject: string;
  body: string;
}

/** Step 2's "Generate with AI" — one template with merge tokens, not a
 * unique email per lead (that's what "personalized template with merge
 * variables" means here, and it's also the only way this stays one API
 * call instead of one per recipient). */
export async function generateEmailTemplate(
  input: GenerateTemplateInput
): Promise<GeneratedTemplate> {
  const offer = input.offerDescription.trim();
  if (!offer) throw new Error("Describe your service or offer first.");

  const anthropic = getAnthropic();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    system:
      "You write short, specific cold outreach emails for a local SEO/marketing agency reaching out to local businesses. Always include the literal merge tokens {{business_name}} and {{opportunity_reason}} verbatim (with double curly braces, unmodified) at least once each — never replace them with real values, since they're substituted per-recipient later. Keep the body under 120 words, no generic filler, no gimmicky subject lines, and end with a low-friction call to action. Respond with exactly this shape: a first line starting with 'Subject: ', then a blank line, then the body.",
    messages: [
      {
        role: "user",
        content: `The sender's service/offer, in their own words: "${offer}"\n\nWrite the cold email template now.`,
      },
    ],
  });

  const text = message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n");

  return parseGeneratedTemplate(text);
}

function parseGeneratedTemplate(text: string): GeneratedTemplate {
  const subjectMatch = text.match(/Subject:\s*(.+)/i);
  const subject =
    subjectMatch?.[1]?.trim() || "A quick idea for {{business_name}}";
  const body = text.replace(/Subject:\s*.+/i, "").trim() || text.trim();
  return { subject, body };
}

export interface SendTestEmailInput {
  senderAccountId: string;
  subject: string;
  body: string;
  sampleLead: {
    businessName: string;
    category: string | null;
    opportunityScoreBreakdown: OpportunityScoreBreakdown;
  };
}

export async function sendTestEmail(input: SendTestEmailInput): Promise<void> {
  const { supabase, organizationId } = await requireOrganizationId();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email)
    throw new Error("Your account has no email address to send the test to.");

  const { data: senderAccount } = await supabase
    .from("sender_accounts")
    .select("id, email_address, provider, encrypted_credentials")
    .eq("id", input.senderAccountId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!senderAccount) throw new Error("Sender account not found.");

  const mergeData = {
    businessName: input.sampleLead.businessName,
    category: input.sampleLead.category,
    opportunityScoreBreakdown: input.sampleLead.opportunityScoreBreakdown,
  };

  await sendCampaignEmail(senderAccount, {
    to: user.email,
    subject: `[Test] ${renderTemplate(input.subject, mergeData)}`,
    text: renderTemplate(input.body, mergeData),
  });
}

interface RecipientLeadRow {
  id: string;
  email: string | null;
  email_validation_status: EmailValidationStatus;
}

function partitionRecipients(
  leads: RecipientLeadRow[],
  unsubscribedEmails: Set<string>,
  includeUnvalidatedEmails: boolean
) {
  const eligible: RecipientLeadRow[] = [];
  let skippedNoEmail = 0;
  let skippedUnvalidated = 0;
  let skippedUnsubscribed = 0;

  for (const lead of leads) {
    if (!lead.email) {
      skippedNoEmail++;
      continue;
    }
    if (unsubscribedEmails.has(lead.email.toLowerCase())) {
      skippedUnsubscribed++;
      continue;
    }
    if (
      !includeUnvalidatedEmails &&
      lead.email_validation_status !== "valid" &&
      lead.email_validation_status !== "risky"
    ) {
      skippedUnvalidated++;
      continue;
    }
    eligible.push(lead);
  }

  return { eligible, skippedNoEmail, skippedUnvalidated, skippedUnsubscribed };
}

async function loadRecipientRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  leadIds: string[]
) {
  const { data: leads } = await supabase
    .from("leads")
    .select("id, email, email_validation_status")
    .eq("organization_id", organizationId)
    .in("id", leadIds);

  const { data: unsubscribed } = await supabase
    .from("unsubscribes")
    .select("email")
    .eq("organization_id", organizationId);

  const unsubscribedEmails = new Set(
    (unsubscribed ?? []).map((row) => row.email.toLowerCase())
  );

  return { leads: leads ?? [], unsubscribedEmails };
}

export interface RecipientPreview {
  totalSelected: number;
  eligibleCount: number;
  skippedNoEmail: number;
  skippedUnvalidated: number;
  skippedUnsubscribed: number;
}

export async function getRecipientPreview(
  leadIds: string[],
  includeUnvalidatedEmails: boolean
): Promise<RecipientPreview> {
  if (leadIds.length === 0) {
    return {
      totalSelected: 0,
      eligibleCount: 0,
      skippedNoEmail: 0,
      skippedUnvalidated: 0,
      skippedUnsubscribed: 0,
    };
  }
  const { supabase, organizationId } = await requireOrganizationId();
  const { leads, unsubscribedEmails } = await loadRecipientRows(
    supabase,
    organizationId,
    leadIds
  );
  const result = partitionRecipients(
    leads,
    unsubscribedEmails,
    includeUnvalidatedEmails
  );

  return {
    totalSelected: leadIds.length,
    eligibleCount: result.eligible.length,
    skippedNoEmail: result.skippedNoEmail,
    skippedUnvalidated: result.skippedUnvalidated,
    skippedUnsubscribed: result.skippedUnsubscribed,
  };
}

export interface LaunchCampaignInput {
  campaignName: string;
  leadIds: string[];
  emailSubject: string;
  emailBody: string;
  senderAccountId: string;
  includeUnvalidatedEmails: boolean;
  scheduledAt?: string;
}

export interface LaunchCampaignResult {
  id: string;
  queuedCount: number;
  skippedCount: number;
}

/**
 * Launch: creates the real campaign row, filters the selected leads down
 * to eligible recipients (has an email; not on the org's unsubscribe
 * list, never overridable; validated unless includeUnvalidatedEmails),
 * inserts one campaign_leads row per eligible recipient, and enqueues one
 * real BullMQ job per recipient with a delay computed to respect the
 * sender's daily limit (dayOffset * 24h + a 30s stagger within the day).
 */
export async function launchCampaign(
  input: LaunchCampaignInput
): Promise<LaunchCampaignResult> {
  const name = input.campaignName.trim();
  if (!name) throw new Error("Give the campaign a name.");
  if (input.leadIds.length === 0) throw new Error("Select at least one lead.");
  if (!input.senderAccountId) throw new Error("Choose a sender account.");
  if (!input.emailSubject.trim() || !input.emailBody.trim()) {
    throw new Error("Write the campaign email before launching.");
  }

  const { supabase, organizationId, userId } = await requireOrganizationId();

  const { data: senderAccount } = await supabase
    .from("sender_accounts")
    .select("id, daily_send_limit, warmup_enabled, warmup_started_at")
    .eq("id", input.senderAccountId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!senderAccount) throw new Error("Sender account not found.");

  const { leads, unsubscribedEmails } = await loadRecipientRows(
    supabase,
    organizationId,
    input.leadIds
  );
  const { eligible, skippedNoEmail, skippedUnvalidated, skippedUnsubscribed } =
    partitionRecipients(
      leads,
      unsubscribedEmails,
      input.includeUnvalidatedEmails
    );
  const skippedCount =
    skippedNoEmail + skippedUnvalidated + skippedUnsubscribed;

  if (eligible.length === 0) {
    throw new Error(
      "No eligible recipients — every selected lead was skipped (no email, unvalidated, or unsubscribed)."
    );
  }

  const status: CampaignStatus = input.scheduledAt ? "scheduled" : "sending";

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      organization_id: organizationId,
      created_by: userId,
      sender_account_id: input.senderAccountId,
      name,
      status,
      scheduled_at: input.scheduledAt || null,
      email_subject: input.emailSubject,
      email_body: input.emailBody,
      include_unvalidated_emails: input.includeUnvalidatedEmails,
    })
    .select("id")
    .single();
  if (campaignError || !campaign) {
    throw new Error(campaignError?.message ?? "Couldn't create campaign.");
  }

  const { data: campaignLeads, error: insertError } = await supabase
    .from("campaign_leads")
    .insert(
      eligible.map((lead) => ({ campaign_id: campaign.id, lead_id: lead.id }))
    )
    .select("id");
  if (insertError) {
    throw new Error(`Couldn't add recipients: ${insertError.message}`);
  }

  const rows = campaignLeads ?? [];
  const dailyLimit = Math.max(
    1,
    getEffectiveDailyLimit({
      dailySendLimit: senderAccount.daily_send_limit,
      warmupEnabled: senderAccount.warmup_enabled,
      warmupStartedAt: senderAccount.warmup_started_at,
    })
  );
  const baseDelayMs = input.scheduledAt
    ? Math.max(0, new Date(input.scheduledAt).getTime() - Date.now())
    : 0;

  const queue = getQueue(QUEUE_NAMES.campaignSend);
  await Promise.all(
    rows.map((row, index) => {
      const dayOffset = Math.floor(index / dailyLimit);
      const withinDayIndex = index % dailyLimit;
      const delay =
        baseDelayMs +
        dayOffset * DAY_MS +
        withinDayIndex * INTRA_DAY_SPACING_MS;
      const jobData: CampaignSendJobData = { campaignLeadId: row.id };
      return queue.add("campaign-send", jobData, {
        delay,
        attempts: 100,
        backoff: { type: "fixed", delay: 60 * 60 * 1000 },
      });
    })
  );

  return { id: campaign.id, queuedCount: rows.length, skippedCount };
}
