import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignBuilderForm } from "@/components/dashboard/campaign-builder-form";

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
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Campaign</h1>
        <p className="text-muted-foreground mt-1">
          Create the campaign, then add leads to it from the Leads page.
        </p>
      </div>

      <CampaignBuilderForm />
    </div>
  );
}
