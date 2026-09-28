"use server";

import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { getWarmupProgress, type WarmupProgress } from "@/lib/sender-warmup";
import type { SenderProvider } from "@/lib/types/database.types";

async function requireOrganizationId(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  userId: string;
  userEmail: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("No organization found for your account.");

  return {
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
    userEmail: user.email ?? null,
  };
}

async function getSentToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  senderAccountId: string
): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("campaign_leads")
    .select("*, campaigns!inner(sender_account_id)", {
      count: "exact",
      head: true,
    })
    .eq("campaigns.sender_account_id", senderAccountId)
    .gte("sent_at", startOfToday.toISOString());

  return count ?? 0;
}

export interface SenderDetail {
  id: string;
  emailAddress: string;
  provider: SenderProvider;
  isActive: boolean;
  dailySendLimit: number;
  sentToday: number;
  warmup: WarmupProgress;
  createdAt: string;
}

export async function listSendersDetailed(): Promise<SenderDetail[]> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("sender_accounts")
    .select(
      "id, email_address, provider, is_active, daily_send_limit, warmup_enabled, warmup_started_at, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load sender accounts: ${error.message}`);

  return Promise.all(
    (data ?? []).map(async (account) => ({
      id: account.id,
      emailAddress: account.email_address,
      provider: account.provider,
      isActive: account.is_active,
      dailySendLimit: account.daily_send_limit,
      sentToday: await getSentToday(supabase, account.id),
      warmup: getWarmupProgress({
        dailySendLimit: account.daily_send_limit,
        warmupEnabled: account.warmup_enabled,
        warmupStartedAt: account.warmup_started_at,
      }),
      createdAt: account.created_at,
    }))
  );
}

export async function getSenderDetail(
  id: string
): Promise<SenderDetail | null> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { data: account } = await supabase
    .from("sender_accounts")
    .select(
      "id, email_address, provider, is_active, daily_send_limit, warmup_enabled, warmup_started_at, created_at"
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!account) return null;

  return {
    id: account.id,
    emailAddress: account.email_address,
    provider: account.provider,
    isActive: account.is_active,
    dailySendLimit: account.daily_send_limit,
    sentToday: await getSentToday(supabase, account.id),
    warmup: getWarmupProgress({
      dailySendLimit: account.daily_send_limit,
      warmupEnabled: account.warmup_enabled,
      warmupStartedAt: account.warmup_started_at,
    }),
    createdAt: account.created_at,
  };
}

export interface VerifySmtpInput {
  emailAddress: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
}

/**
 * "Send Test Email" — a real SMTP handshake (nodemailer's verify(), which
 * fails fast and clearly on a bad host/port/credential) followed by an
 * actual test message to the signed-in user's own inbox. The connect
 * dialog only enables its "Connect" button once this has succeeded.
 */
export async function verifySmtpConnection(
  input: VerifySmtpInput
): Promise<void> {
  const { userEmail } = await requireOrganizationId();
  if (!userEmail)
    throw new Error("Your account has no email address to send the test to.");

  const transporter = nodemailer.createTransport({
    host: input.smtpHost,
    port: input.smtpPort,
    secure: input.smtpPort === 465,
    auth: { user: input.smtpUsername, pass: input.smtpPassword },
  });

  try {
    await transporter.verify();
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Couldn't connect: ${error.message}`
        : "Couldn't connect to that SMTP server."
    );
  }

  await transporter.sendMail({
    from: input.emailAddress,
    to: userEmail,
    subject: "Test email from LocalLeads AI",
    text: "This confirms your SMTP sender connection works. You're good to save it.",
  });
}

export async function toggleSenderActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { error } = await supabase
    .from("sender_accounts")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw new Error(`Couldn't update sender: ${error.message}`);
}

/** Turning warm-up back on after it was off restarts the ramp from day 1
 * — a fresh warmup_started_at is the honest choice, since the account's
 * recent sending history (while warm-up was off) doesn't tell us
 * anything about how a receiving server currently trusts it. */
export async function toggleSenderWarmup(
  id: string,
  warmupEnabled: boolean
): Promise<void> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { data: existing } = await supabase
    .from("sender_accounts")
    .select("warmup_enabled")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!existing) throw new Error("Sender account not found.");

  const update: { warmup_enabled: boolean; warmup_started_at?: string } = {
    warmup_enabled: warmupEnabled,
  };
  if (warmupEnabled && !existing.warmup_enabled) {
    update.warmup_started_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("sender_accounts")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(`Couldn't update warm-up: ${error.message}`);
}

export interface SenderUsage {
  activeCampaigns: Array<{ id: string; name: string }>;
}

export async function getSenderUsage(id: string): Promise<SenderUsage> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { data } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("sender_account_id", id)
    .in("status", ["scheduled", "sending", "paused"]);

  return { activeCampaigns: data ?? [] };
}

export async function removeSender(id: string): Promise<void> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { error } = await supabase
    .from("sender_accounts")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw new Error(`Couldn't remove sender: ${error.message}`);
}
