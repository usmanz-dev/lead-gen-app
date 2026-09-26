import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  leadsQuerySchema,
  sanitizeSearchTerm,
} from "@/lib/validations/leads-query";

const LIST_COLUMNS =
  "id, name, category, phone, website_url, rating, review_count, email, email_validation_status, opportunity_score, status, search_id, created_at";

/**
 * Server-side paginated/filtered/sorted lead listing — the leads table
 * (components/dashboard/leads-table.tsx) calls this on every filter, sort,
 * and page change instead of loading the org's whole leads set client-side,
 * so it stays fast at thousands of rows.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = leadsQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query" },
      { status: 400 }
    );
  }
  const {
    page,
    pageSize,
    q,
    status,
    minScore,
    maxScore,
    hasEmail,
    searchId,
    sortBy,
    sortDir,
  } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 403 }
    );
  }

  let query = supabase
    .from("leads")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("organization_id", membership.organization_id);

  if (q) {
    const safeQ = sanitizeSearchTerm(q);
    if (safeQ) {
      query = query.or(
        `name.ilike.%${safeQ}%,email.ilike.%${safeQ}%,phone.ilike.%${safeQ}%,category.ilike.%${safeQ}%`
      );
    }
  }
  if (status.length > 0) query = query.in("status", status);
  if (minScore !== undefined) query = query.gte("opportunity_score", minScore);
  if (maxScore !== undefined) query = query.lte("opportunity_score", maxScore);
  if (hasEmail === "yes") query = query.not("email", "is", null);
  if (hasEmail === "no") query = query.is("email", null);
  if (searchId) query = query.eq("search_id", searchId);

  query = query.order(sortBy, {
    ascending: sortDir === "asc",
    nullsFirst: false,
  });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    rows: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
