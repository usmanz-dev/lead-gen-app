import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  leadsFilterSchema,
  sanitizeSearchTerm,
} from "@/lib/validations/leads-query";

const EXPORT_COLUMNS =
  "name, category, phone, address, rating, review_count, website_url, email, email_validation_status, opportunity_score, status, created_at";

// Safety cap on a single export — well above any real use of this feature,
// but keeps one request from trying to stream an unbounded result set.
const MAX_EXPORT_ROWS = 5000;

const CSV_HEADERS = [
  "Business Name",
  "Category",
  "Phone",
  "Address",
  "Rating",
  "Reviews",
  "Website",
  "Email",
  "Email Status",
  "Opportunity Score",
  "Status",
  "Created At",
];

function toCsvField(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Exports the caller's leads as a real CSV file — either an explicit set of
 * selected ids (the bulk actions bar's "Export CSV") or, with no `ids`
 * given, every lead matching the toolbar's current filters. Never a
 * client-side dump of already-loaded rows, since the table only ever holds
 * one page's worth of data.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

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
    .select(EXPORT_COLUMNS)
    .eq("organization_id", membership.organization_id);

  const idsParam = searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam.split(",").filter((id) => UUID_REGEX.test(id));
    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No valid lead ids given" },
        { status: 400 }
      );
    }
    query = query.in("id", ids.slice(0, MAX_EXPORT_ROWS));
  } else {
    const parsed = leadsFilterSchema.safeParse(
      Object.fromEntries(searchParams)
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 }
      );
    }
    const {
      q,
      status,
      minScore,
      maxScore,
      hasEmail,
      searchId,
      sortBy,
      sortDir,
    } = parsed.data;

    if (q) {
      const safeQ = sanitizeSearchTerm(q);
      if (safeQ) {
        query = query.or(
          `name.ilike.%${safeQ}%,email.ilike.%${safeQ}%,phone.ilike.%${safeQ}%,category.ilike.%${safeQ}%`
        );
      }
    }
    if (status.length > 0) query = query.in("status", status);
    if (minScore !== undefined)
      query = query.gte("opportunity_score", minScore);
    if (maxScore !== undefined)
      query = query.lte("opportunity_score", maxScore);
    if (hasEmail === "yes") query = query.not("email", "is", null);
    if (hasEmail === "no") query = query.is("email", null);
    if (searchId) query = query.eq("search_id", searchId);

    query = query.order(sortBy, {
      ascending: sortDir === "asc",
      nullsFirst: false,
    });
  }

  query = query.limit(MAX_EXPORT_ROWS);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lines = [CSV_HEADERS.join(",")];
  for (const lead of data ?? []) {
    lines.push(
      [
        toCsvField(lead.name),
        toCsvField(lead.category),
        toCsvField(lead.phone),
        toCsvField(lead.address),
        toCsvField(lead.rating),
        toCsvField(lead.review_count),
        toCsvField(lead.website_url),
        toCsvField(lead.email),
        toCsvField(lead.email_validation_status),
        toCsvField(lead.opportunity_score),
        toCsvField(lead.status),
        toCsvField(lead.created_at),
      ].join(",")
    );
  }
  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
