import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CampaignStatus } from "@/lib/types/database.types";

export interface CampaignListItem {
  id: string;
  name: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  createdAt: string;
  leadCount: number;
  sentCount: number;
  openedCount: number;
  repliedCount: number;
  bouncedCount: number;
}

/**
 * One query for the campaigns themselves, one for every campaign_lead row
 * belonging to them, aggregated here in JS. Campaign counts stay small
 * relative to the org's whole lead volume (unlike the Leads List, which
 * needed real server-side pagination), so this is the simpler option
 * without sacrificing correctness.
 */
export async function getCampaignsWithStats(
  organizationId: string
): Promise<CampaignListItem[]> {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, scheduled_at, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!campaigns || campaigns.length === 0) return [];

  const { data: campaignLeads } = await supabase
    .from("campaign_leads")
    .select("campaign_id, sent_at, opened_at, replied_at, bounced_at")
    .in(
      "campaign_id",
      campaigns.map((c) => c.id)
    );

  const stats = new Map<
    string,
    {
      leadCount: number;
      sentCount: number;
      openedCount: number;
      repliedCount: number;
      bouncedCount: number;
    }
  >();
  for (const row of campaignLeads ?? []) {
    const entry = stats.get(row.campaign_id) ?? {
      leadCount: 0,
      sentCount: 0,
      openedCount: 0,
      repliedCount: 0,
      bouncedCount: 0,
    };
    entry.leadCount++;
    if (row.sent_at) entry.sentCount++;
    if (row.opened_at) entry.openedCount++;
    if (row.replied_at) entry.repliedCount++;
    if (row.bounced_at) entry.bouncedCount++;
    stats.set(row.campaign_id, entry);
  }

  return campaigns.map((campaign) => {
    const entry = stats.get(campaign.id) ?? {
      leadCount: 0,
      sentCount: 0,
      openedCount: 0,
      repliedCount: 0,
      bouncedCount: 0,
    };
    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      scheduledAt: campaign.scheduled_at,
      createdAt: campaign.created_at,
      ...entry,
    };
  });
}

export interface CampaignHeader {
  id: string;
  name: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  createdAt: string;
  senderEmail: string | null;
}

export async function getCampaignHeader(
  campaignId: string
): Promise<CampaignHeader | null> {
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, name, status, scheduled_at, created_at, sender_accounts(email_address)"
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign) return null;

  const senderAccount = campaign.sender_accounts as unknown as {
    email_address: string;
  } | null;

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    scheduledAt: campaign.scheduled_at,
    createdAt: campaign.created_at,
    senderEmail: senderAccount?.email_address ?? null,
  };
}

export interface CampaignStats {
  leadCount: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  repliedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
}

export async function getCampaignStats(
  campaignId: string
): Promise<CampaignStats> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaign_leads")
    .select(
      "email_status, sent_at, opened_at, clicked_at, replied_at, bounced_at"
    )
    .eq("campaign_id", campaignId);

  const stats: CampaignStats = {
    leadCount: 0,
    sentCount: 0,
    openedCount: 0,
    clickedCount: 0,
    repliedCount: 0,
    bouncedCount: 0,
    unsubscribedCount: 0,
  };

  for (const row of data ?? []) {
    stats.leadCount++;
    if (row.sent_at) stats.sentCount++;
    if (row.opened_at) stats.openedCount++;
    if (row.clicked_at) stats.clickedCount++;
    if (row.replied_at) stats.repliedCount++;
    if (row.bounced_at) stats.bouncedCount++;
    if (row.email_status === "unsubscribed") stats.unsubscribedCount++;
  }

  return stats;
}
