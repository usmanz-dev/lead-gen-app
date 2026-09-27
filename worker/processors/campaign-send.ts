import type { Queue } from "bullmq";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCampaignEmail } from "@/lib/campaign-email-sender";
import { renderTemplate } from "@/lib/merge-template";
import type { CampaignSendJobData } from "@/lib/jobs/campaign-send";
import type { OpportunityScoreBreakdown } from "@/lib/types/domain";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sends one recipient's campaign email. The producer (launchCampaign)
 * already spaced jobs out to respect the sender's daily limit — this
 * still rechecks live (another campaign from the same sender could be
 * sending concurrently) and always rechecks the unsubscribe list, since
 * either can change between enqueue and this job actually running.
 */
export async function processCampaignSendJob(
  data: CampaignSendJobData,
  campaignSendQueue: Queue<CampaignSendJobData>
): Promise<void> {
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("campaign_leads")
    .select(
      "id, campaign_id, lead_id, email_status, campaigns(id, organization_id, sender_account_id, status, email_subject, email_body), leads(name, email, category, opportunity_score_breakdown)"
    )
    .eq("id", data.campaignLeadId)
    .maybeSingle();

  if (!row) return; // Deleted since being enqueued.
  if (row.email_status !== "queued") return; // Already handled.

  const campaign = row.campaigns as unknown as {
    id: string;
    organization_id: string;
    sender_account_id: string | null;
    status: string;
    email_subject: string | null;
    email_body: string | null;
  } | null;
  const lead = row.leads as unknown as {
    name: string;
    email: string | null;
    category: string | null;
    opportunity_score_breakdown: OpportunityScoreBreakdown;
  } | null;

  if (!campaign || !lead || !lead.email) return;

  if (campaign.status === "scheduled") {
    // First job to actually run for a scheduled campaign flips it to
    // "sending" — no separate scheduler process needed for this.
    await supabase
      .from("campaigns")
      .update({ status: "sending" })
      .eq("id", campaign.id);
  } else if (campaign.status !== "sending") {
    throw new Error(`Campaign is ${campaign.status} — will retry later.`);
  }

  const { data: unsubscribed } = await supabase
    .from("unsubscribes")
    .select("id")
    .eq("organization_id", campaign.organization_id)
    .eq("email", lead.email)
    .maybeSingle();
  if (unsubscribed) {
    await supabase
      .from("campaign_leads")
      .update({ email_status: "unsubscribed" })
      .eq("id", row.id);
    return;
  }

  if (!campaign.sender_account_id) {
    throw new Error("Campaign has no sender account configured.");
  }
  const { data: senderAccount } = await supabase
    .from("sender_accounts")
    .select(
      "id, email_address, provider, encrypted_credentials, daily_send_limit"
    )
    .eq("id", campaign.sender_account_id)
    .maybeSingle();
  if (!senderAccount) throw new Error("Sender account not found.");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const { count: sentToday } = await supabase
    .from("campaign_leads")
    .select("*, campaigns!inner(sender_account_id)", {
      count: "exact",
      head: true,
    })
    .eq("campaigns.sender_account_id", senderAccount.id)
    .gte("sent_at", startOfToday.toISOString());

  if ((sentToday ?? 0) >= senderAccount.daily_send_limit) {
    // Another campaign from this sender used up today's slots since this
    // job's delay was computed — push it to tomorrow instead of failing.
    await campaignSendQueue.add("campaign-send", data, { delay: DAY_MS });
    return;
  }

  const mergeData = {
    businessName: lead.name,
    category: lead.category,
    opportunityScoreBreakdown: lead.opportunity_score_breakdown,
  };
  const subject = renderTemplate(campaign.email_subject ?? "", mergeData);
  const body = renderTemplate(campaign.email_body ?? "", mergeData);

  await sendCampaignEmail(senderAccount, {
    to: lead.email,
    subject,
    text: body,
  });

  await supabase
    .from("campaign_leads")
    .update({ email_status: "sent", sent_at: new Date().toISOString() })
    .eq("id", row.id);
}
