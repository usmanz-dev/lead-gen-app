import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyOAuthState } from "@/lib/oauth-state";
import {
  exchangeCodeForTokens,
  getGoogleAccountEmail,
} from "@/lib/google-oauth";
import { encryptCredential } from "@/lib/crypto";

export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const settingsUrl = new URL("/dashboard/settings/senders", appUrl);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const googleError = searchParams.get("error");

  if (googleError) {
    settingsUrl.searchParams.set(
      "error",
      googleError === "access_denied"
        ? "Google sign-in was cancelled."
        : googleError
    );
    return NextResponse.redirect(settingsUrl);
  }
  if (!code || !state) {
    settingsUrl.searchParams.set("error", "Missing code or state from Google.");
    return NextResponse.redirect(settingsUrl);
  }

  const verified = verifyOAuthState(state);
  if (!verified) {
    settingsUrl.searchParams.set(
      "error",
      "This sign-in link expired — please try again."
    );
    return NextResponse.redirect(settingsUrl);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", verified.organizationId)
    .maybeSingle();
  if (!membership) {
    settingsUrl.searchParams.set(
      "error",
      "This sign-in link is for a different account."
    );
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const { refreshToken, accessToken } = await exchangeCodeForTokens(code);
    const emailAddress = await getGoogleAccountEmail(accessToken);
    const encryptedCredentials = encryptCredential(
      JSON.stringify({ refreshToken })
    );

    const { data: existing } = await supabase
      .from("sender_accounts")
      .select("id")
      .eq("organization_id", membership.organization_id)
      .eq("email_address", emailAddress)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("sender_accounts")
        .update({
          encrypted_credentials: encryptedCredentials,
          provider: "gmail",
          is_active: true,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("sender_accounts").insert({
        organization_id: membership.organization_id,
        email_address: emailAddress,
        provider: "gmail",
        encrypted_credentials: encryptedCredentials,
      });
    }

    settingsUrl.searchParams.set("connected", emailAddress);
    return NextResponse.redirect(settingsUrl);
  } catch (error) {
    settingsUrl.searchParams.set(
      "error",
      error instanceof Error
        ? error.message
        : "Couldn't connect this Google account."
    );
    return NextResponse.redirect(settingsUrl);
  }
}
