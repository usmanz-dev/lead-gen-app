import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Polled by the search page's progress UI. Reads directly off the
 * `searches` row the worker updates in place (status, leads_found,
 * error_message) — RLS scopes this to the caller's own organization, so a
 * request for another org's search id comes back as a normal 404 rather
 * than leaking existence.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: search, error } = await supabase
    .from("searches")
    .select("id, keyword, location, status, leads_found, error_message")
    .eq("id", id)
    .maybeSingle();

  if (error || !search) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  return NextResponse.json({ search });
}
