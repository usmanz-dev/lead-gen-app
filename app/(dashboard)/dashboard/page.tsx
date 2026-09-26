import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Send, MessageCircleReply, Gauge, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageCard } from "@/components/dashboard/usage-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { EmptyDashboardState } from "@/components/dashboard/empty-dashboard-state";
import {
  getUsageSummary,
  getQuickStats,
  getRecentActivity,
  getDailyLeadCounts,
  isOrganizationEmpty,
} from "@/lib/dashboard";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

  const organizationId = membership.organization_id;
  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  const [usage, stats, activity, dailyCounts, isEmpty] = await Promise.all([
    getUsageSummary(organizationId),
    getQuickStats(organizationId),
    getRecentActivity(organizationId),
    getDailyLeadCounts(organizationId),
    isOrganizationEmpty(organizationId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {usage.isTrial ? (
              <>
                You&apos;re on a free trial.{" "}
                <Link href="/pricing" className="text-primary hover:underline">
                  Choose a plan
                </Link>{" "}
                anytime.
              </>
            ) : (
              `${usage.plan} plan`
            )}
          </p>
        </div>
        <Button render={<Link href="/dashboard/search" />}>
          <Sparkles className="size-4" aria-hidden="true" />
          New Lead Search
        </Button>
      </div>

      {isEmpty ? (
        <EmptyDashboardState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UsageCard
              label="Leads used"
              used={usage.leadsUsed}
              limit={usage.leadsLimit}
            />
            <UsageCard
              label="Emails sent"
              used={usage.emailsUsed}
              limit={usage.emailsLimit}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total leads"
              value={stats.totalLeads.toLocaleString()}
              trend={stats.totalLeadsTrend}
            />
            <StatCard
              icon={Send}
              label="Active campaigns"
              value={stats.activeCampaigns.toLocaleString()}
            />
            <StatCard
              icon={MessageCircleReply}
              label="Avg. reply rate"
              value={
                stats.avgReplyRate !== null ? `${stats.avgReplyRate}%` : "—"
              }
            />
            <StatCard
              icon={Gauge}
              label="Avg. Opportunity Score"
              value={
                stats.avgOpportunityScore !== null
                  ? String(stats.avgOpportunityScore)
                  : "—"
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Leads collected — last 30 days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeadsChart data={dailyCounts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed events={activity} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
