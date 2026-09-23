import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPlan, type PlanId } from "@/lib/plans";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface UsageSummary {
  plan: string;
  isTrial: boolean;
  leadsUsed: number;
  leadsLimit: number;
  emailsUsed: number;
  emailsLimit: number;
}

/** Falls back to Starter-tier trial limits when no subscription row exists
 * yet — true for any org that hasn't been through Stripe Checkout. */
export async function getUsageSummary(
  organizationId: string
): Promise<UsageSummary> {
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "plan, leads_used_this_cycle, leads_limit, emails_used_this_cycle, emails_limit"
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (subscription) {
    return {
      plan: capitalize(subscription.plan),
      isTrial: false,
      leadsUsed: subscription.leads_used_this_cycle,
      leadsLimit: subscription.leads_limit,
      emailsUsed: subscription.emails_used_this_cycle,
      emailsLimit: subscription.emails_limit,
    };
  }

  const starter = getPlan("starter" as PlanId);
  return {
    plan: "Free trial",
    isTrial: true,
    leadsUsed: 0,
    leadsLimit: starter.leadsLimit,
    emailsUsed: 0,
    emailsLimit: starter.emailsLimit,
  };
}

export interface QuickStats {
  totalLeads: number;
  totalLeadsTrend: number | null;
  activeCampaigns: number;
  avgReplyRate: number | null;
  avgOpportunityScore: number | null;
}

export async function getQuickStats(
  organizationId: string
): Promise<QuickStats> {
  const supabase = await createClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS).toISOString();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS).toISOString();

  const [
    { count: totalLeads },
    { count: leadsLast30 },
    { count: leadsPrev30 },
    { count: activeCampaigns },
    { count: sentCount },
    { count: repliedCount },
    { data: scoreRows },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", sixtyDaysAgo)
      .lt("created_at", thirtyDaysAgo),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    supabase
      .from("campaign_leads")
      .select("*, campaigns!inner(organization_id)", {
        count: "exact",
        head: true,
      })
      .eq("campaigns.organization_id", organizationId)
      .in("email_status", ["sent", "opened", "clicked", "replied", "bounced"]),
    supabase
      .from("campaign_leads")
      .select("*, campaigns!inner(organization_id)", {
        count: "exact",
        head: true,
      })
      .eq("campaigns.organization_id", organizationId)
      .eq("email_status", "replied"),
    supabase
      .from("leads")
      .select("opportunity_score")
      .eq("organization_id", organizationId)
      .not("opportunity_score", "is", null),
  ]);

  const scores = (scoreRows ?? [])
    .map((row) => row.opportunity_score)
    .filter((score): score is number => score !== null);
  const avgOpportunityScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : null;

  return {
    totalLeads: totalLeads ?? 0,
    totalLeadsTrend: percentChange(leadsPrev30 ?? 0, leadsLast30 ?? 0),
    activeCampaigns: activeCampaigns ?? 0,
    avgReplyRate:
      sentCount && sentCount > 0
        ? Math.round(((repliedCount ?? 0) / sentCount) * 100)
        : null,
    avgOpportunityScore,
  };
}

export type ActivityEventType =
  "search_completed" | "email_sent" | "lead_replied" | "email_bounced";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  message: string;
  timestamp: string;
}

export async function getRecentActivity(
  organizationId: string,
  limit = 10
): Promise<ActivityEvent[]> {
  const supabase = await createClient();

  const [{ data: searches }, { data: campaignLeads }] = await Promise.all([
    supabase
      .from("searches")
      .select("id, keyword, location, leads_found, updated_at")
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("campaign_leads")
      .select(
        "id, email_status, sent_at, replied_at, bounced_at, leads(name), campaigns!inner(organization_id, name)"
      )
      .eq("campaigns.organization_id", organizationId)
      .in("email_status", ["sent", "replied", "bounced"])
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);

  const events: ActivityEvent[] = [];

  for (const search of searches ?? []) {
    events.push({
      id: `search-${search.id}`,
      type: "search_completed",
      message: `Search "${search.keyword}" in ${search.location} completed — ${search.leads_found} leads found`,
      timestamp: search.updated_at,
    });
  }

  for (const row of campaignLeads ?? []) {
    const leadName =
      (row.leads as unknown as { name: string } | null)?.name ?? "a lead";
    const campaignName =
      (row.campaigns as unknown as { name: string } | null)?.name ??
      "a campaign";

    if (row.email_status === "sent" && row.sent_at) {
      events.push({
        id: `sent-${row.id}`,
        type: "email_sent",
        message: `Email sent to ${leadName} in "${campaignName}"`,
        timestamp: row.sent_at,
      });
    } else if (row.email_status === "replied" && row.replied_at) {
      events.push({
        id: `replied-${row.id}`,
        type: "lead_replied",
        message: `${leadName} replied to "${campaignName}"`,
        timestamp: row.replied_at,
      });
    } else if (row.email_status === "bounced" && row.bounced_at) {
      events.push({
        id: `bounced-${row.id}`,
        type: "email_bounced",
        message: `Email to ${leadName} bounced in "${campaignName}"`,
        timestamp: row.bounced_at,
      });
    }
  }

  return events
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit);
}

export interface DailyLeadCount {
  date: string;
  count: number;
}

export async function getDailyLeadCounts(
  organizationId: string,
  days = 30
): Promise<DailyLeadCount[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - (days - 1) * DAY_MS);
  since.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("leads")
    .select("created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", since.toISOString());

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const date = new Date(since.getTime() + i * DAY_MS);
    counts.set(dateKey(date), 0);
  }

  for (const row of data ?? []) {
    const key = dateKey(new Date(row.created_at));
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export async function isOrganizationEmpty(
  organizationId: string
): Promise<boolean> {
  const supabase = await createClient();
  const [{ count: leadsCount }, { count: searchesCount }] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("searches")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);

  return (leadsCount ?? 0) === 0 && (searchesCount ?? 0) === 0;
}

function percentChange(previous: number, current: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
