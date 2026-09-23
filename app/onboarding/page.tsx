import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Radar, PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Welcome" };

// This is an authenticated page — always render fresh, never prerender.
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

  let orgName: string | null = null;

  if (membership?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", membership.organization_id)
      .maybeSingle();
    orgName = org?.name ?? null;
  }

  // Safety net: the signup form creates the organization directly, but if
  // that insert failed (or this account came in via an older flow), create
  // one now rather than leaving the user stuck with no organization.
  if (!orgName) {
    const fallbackName = `${firstName}'s Organization`;
    const { data: newOrg } = await supabase
      .from("organizations")
      .insert({ name: fallbackName })
      .select("name")
      .single();
    orgName = newOrg?.name ?? fallbackName;
  }

  return (
    <div className="from-primary/10 via-background to-secondary/50 flex min-h-screen flex-col items-center justify-center bg-linear-to-br px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <Radar className="text-primary size-5" aria-hidden="true" />
        <span>LocalLeads AI</span>
      </Link>

      <div className="border-border bg-card w-[92%] max-w-105 rounded-xl border p-6 text-center shadow-sm sm:p-8">
        <div className="bg-success/10 text-success mx-auto flex size-12 items-center justify-center rounded-full">
          <PartyPopper className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Welcome, {firstName}!</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Your organization,{" "}
          <strong className="text-foreground">{orgName}</strong>, is ready. You
          can rename it any time from Team Settings.
        </p>
        <p className="text-muted-foreground mt-4 text-xs">
          The full setup wizard (business type, target industries and locations)
          is coming in a later step — for now, head straight to your dashboard.
        </p>
        <Button className="mt-6 w-full" render={<Link href="/dashboard" />}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
