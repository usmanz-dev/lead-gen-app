import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DETAIL_COLUMNS =
  "id, name, category, phone, address, rating, review_count, website_url, google_maps_url, email, email_validation_status, social_links, opportunity_score, opportunity_score_breakdown, status, notes, search_id, created_at";

/** Full lead record for the Lead Detail drawer — fetched on demand rather
 * than included in every paginated list row. */
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

  const { data: lead, error } = await supabase
    .from("leads")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
