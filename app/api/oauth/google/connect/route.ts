import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signOAuthState } from "@/lib/oauth-state";
import { buildGoogleAuthUrl } from "@/lib/google-oauth";

/**
 * "Connect Gmail/Workspace" — a real navigation (not fetch), since it
 * needs the browser to actually hop to Google's consent screen.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return NextResponse.redirect(
      new URL("/onboarding", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  try {
    const state = signOAuthState(membership.organization_id);
    return NextResponse.redirect(buildGoogleAuthUrl(state));
  } catch (error) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = new URL("/dashboard/settings/senders", appUrl);
    url.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Couldn't start Google sign-in."
    );
    return NextResponse.redirect(url);
  }
}
