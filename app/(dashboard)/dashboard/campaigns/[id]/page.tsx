import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCampaignHeader, getCampaignStats } from "@/lib/campaigns";
import { CampaignDetailHeader } from "@/components/dashboard/campaign-detail-header";
import { CampaignLeadsTable } from "@/components/dashboard/campaign-leads-table";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const campaign = await getCampaignHeader(id);
  return { title: campaign?.name ?? "Campaign" };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const campaign = await getCampaignHeader(id);
  if (!campaign) notFound();

  const stats = await getCampaignStats(id);

  return (
    <div className="space-y-6">
      <CampaignDetailHeader campaign={campaign} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Leads" value={stats.leadCount} />
        <StatTile label="Sent" value={stats.sentCount} />
        <StatTile label="Opened" value={stats.openedCount} />
        <StatTile label="Replied" value={stats.repliedCount} />
        <StatTile label="Bounced" value={stats.bouncedCount} />
        <StatTile label="Unsubscribed" value={stats.unsubscribedCount} />
      </div>

      <CampaignLeadsTable campaignId={id} />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
