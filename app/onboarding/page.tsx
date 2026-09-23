import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Radar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import type { BusinessType } from "@/lib/types/database.types";

export const metadata: Metadata = { title: "Welcome" };

// This is an authenticated page whose content depends on this user's
// in-progress onboarding state — never prerender it.
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const fullName = user.user_metadata?.full_name as string | undefined;
  const firstName = fullName?.split(" ")[0] ?? "there";

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let organizationId = membership?.organization_id ?? null;
  let org: {
    business_type: string | null;
    target_industries: string[];
    target_locations: string[];
    onboarding_step: number;
    onboarding_completed: boolean;
  } | null = null;

  if (organizationId) {
    const { data } = await supabase
      .from("organizations")
      .select(
        "business_type, target_industries, target_locations, onboarding_step, onboarding_completed"
      )
      .eq("id", organizationId)
      .maybeSingle();
    org = data;
  }

  // Safety net: the signup form creates the organization directly, but if
  // that insert failed (or this account came in via an older flow), create
  // one now rather than leaving the user stuck with no organization.
  if (!organizationId || !org) {
    const fallbackName = `${firstName}'s Organization`;
    const { data: newOrg } = await supabase
      .from("organizations")
      .insert({ name: fallbackName })
      .select(
        "id, business_type, target_industries, target_locations, onboarding_step, onboarding_completed"
      )
      .single();

    if (newOrg) {
      organizationId = newOrg.id;
      org = newOrg;
    }
  }

  if (org?.onboarding_completed) {
    redirect("/dashboard");
  }

  const { data: senderAccount } = organizationId
    ? await supabase
        .from("sender_accounts")
        .select("email_address")
        .eq("organization_id", organizationId)
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="from-primary/10 via-background to-secondary/50 flex min-h-screen flex-col items-center justify-center bg-linear-to-br px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <Radar className="text-primary size-5" aria-hidden="true" />
        <span>LocalLeads AI</span>
      </Link>

      <OnboardingWizard
        organizationId={organizationId!}
        firstName={firstName}
        initialStep={org?.onboarding_step ?? 0}
        initialBusinessType={
          (org?.business_type as BusinessType | null) ?? null
        }
        initialIndustries={org?.target_industries ?? []}
        initialLocations={org?.target_locations ?? []}
        initialSenderEmail={senderAccount?.email_address ?? null}
      />
    </div>
  );
}
