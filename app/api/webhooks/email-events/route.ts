import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CampaignLeadEmailStatus } from "@/lib/types/database.types";

/**
 * Receives send-status events for campaign_leads rows. No email service
 * provider is wired up to call this yet (leadgen.md's bulk-send pipeline
 * isn't built) — this is the real receiving end for whenever one is: point
 * an ESP's webhook (SendGrid/Postmark/Mailgun/etc.) here with each event
 * carrying the campaign_leads row id as tracking metadata (every major ESP
 * supports passing a custom id through — SendGrid custom_args, Postmark
 * Metadata, Mailgun v:*), and this updates real rows, not a stub.
 */

type TrackedEvent = "sent" | "opened" | "clicked" | "replied" | "bounced";

// Rank used so a late-arriving, less-advanced event (webhooks can arrive
// out of order) never regresses a lead's status backward — except bounced
// and unsubscribed, which are always terminal.
const STATUS_RANK: Record<CampaignLeadEmailStatus, number> = {
  queued: 0,
  sent: 1,
  opened: 2,
  clicked: 3,
  replied: 4,
  bounced: 5,
  unsubscribed: 5,
};

const payloadSchema = z.object({
  campaignLeadId: z.string().uuid(),
  event: z.enum([
    "sent",
    "opened",
    "clicked",
    "replied",
    "bounced",
    "unsubscribed",
  ]),
  occurredAt: z.string().datetime().optional(),
});

function isAuthorized(request: Request): boolean {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "");
  const expected = Buffer.from(secret);
  const actual = Buffer.from(provided);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  if (!process.env.EMAIL_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "EMAIL_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }
  const { campaignLeadId, event, occurredAt } = parsed.data;
  const timestamp = occurredAt ?? new Date().toISOString();

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("campaign_leads")
    .select(
      "email_status, campaign_id, campaigns(organization_id), leads(email)"
    )
    .eq("id", campaignLeadId)
    .maybeSingle();
  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "campaign_leads row not found" },
      { status: 404 }
    );
  }

  const update: Partial<{
    sent_at: string;
    opened_at: string;
    clicked_at: string;
    replied_at: string;
    bounced_at: string;
    email_status: CampaignLeadEmailStatus;
  }> = {};
  switch (event as TrackedEvent | "unsubscribed") {
    case "sent":
      update.sent_at = timestamp;
      break;
    case "opened":
      update.opened_at = timestamp;
      break;
    case "clicked":
      update.clicked_at = timestamp;
      break;
    case "replied":
      update.replied_at = timestamp;
      break;
    case "bounced":
      update.bounced_at = timestamp;
      break;
    case "unsubscribed":
      break;
  }
  if (STATUS_RANK[event] >= STATUS_RANK[existing.email_status]) {
    update.email_status = event;
  }

  if (Object.keys(update).length > 0) {
    const { error: updateError } = await supabase
      .from("campaign_leads")
      .update(update)
      .eq("id", campaignLeadId);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  if (event === "unsubscribed") {
    const organization = existing.campaigns as unknown as {
      organization_id: string;
    } | null;
    const lead = existing.leads as unknown as { email: string | null } | null;
    if (organization && lead?.email) {
      await supabase.from("unsubscribes").upsert(
        {
          organization_id: organization.organization_id,
          campaign_id: existing.campaign_id,
          email: lead.email,
          unsubscribed_at: timestamp,
        },
        { onConflict: "organization_id,email" }
      );
    }
  }

  return NextResponse.json({ received: true });
}
