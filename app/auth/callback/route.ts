import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles both the Google OAuth redirect and the email-confirmation link
 * Supabase Auth sends users back to with a `?code=` param.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Could not authenticate. Please try again.`
  );
}
