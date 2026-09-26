import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CampaignLeadEmailStatus } from "@/lib/types/database.types";

const STATUS_VALUES: CampaignLeadEmailStatus[] = [
  "queued",
  "sent",
  "opened",
  "clicked",
  "replied",
  "bounced",
  "unsubscribed",
];

/**
 * Per-campaign send-status table — mirrors the Leads List's server-side
 * pagination approach so a campaign with thousands of recipients stays
 * fast, even though most campaigns today are far smaller.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(searchParams.get("pageSize") ?? 25) || 25)
  );
  const statusParam = searchParams.get("status");
  const status =
    statusParam &&
    STATUS_VALUES.includes(statusParam as CampaignLeadEmailStatus)
      ? (statusParam as CampaignLeadEmailStatus)
      : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("campaign_leads")
    .select(
      "id, email_status, sent_at, opened_at, clicked_at, replied_at, bounced_at, created_at, leads(id, name, email)",
      { count: "exact" }
    )
    .eq("campaign_id", campaignId);

  if (status) query = query.eq("email_status", status);

  query = query.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((row) => {
    const lead = row.leads as unknown as {
      id: string;
      name: string;
      email: string | null;
    } | null;
    return {
      id: row.id,
      leadId: lead?.id ?? null,
      leadName: lead?.name ?? "Unknown lead",
      email: lead?.email ?? null,
      emailStatus: row.email_status,
      sentAt: row.sent_at,
      openedAt: row.opened_at,
      clickedAt: row.clicked_at,
      repliedAt: row.replied_at,
      bouncedAt: row.bounced_at,
    };
  });

  return NextResponse.json({ rows, total: count ?? 0, page, pageSize });
}
