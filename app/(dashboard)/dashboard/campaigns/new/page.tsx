import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignWizard } from "@/components/dashboard/campaign-wizard/campaign-wizard";

export const metadata: Metadata = { title: "New Campaign" };
export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
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

  return (
    <div className="flex justify-center">
      <CampaignWizard organizationId={membership.organization_id} />
    </div>
  );
}
