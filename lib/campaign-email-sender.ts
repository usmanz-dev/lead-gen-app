// No "server-only" guard — the standalone worker process imports this to
// actually send campaign emails, and that guard throws outside Next's own
// bundler (same reasoning as lib/queue-names.ts and lib/supabase/admin.ts).
import nodemailer from "nodemailer";
import { decryptCredential } from "@/lib/crypto";

interface SmtpCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface SendableSenderAccount {
  id: string;
  email_address: string;
  provider: "gmail" | "smtp";
  encrypted_credentials: string | null;
}

export interface SendCampaignEmailInput {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends one real email through a connected sender account's own SMTP
 * credentials — used both by the worker (actual campaign sends) and by
 * the builder's "Send test email to myself" (Step 4), so a test really
 * goes out through the same path production sends will use.
 *
 * Gmail/Workspace OAuth sending was never wired up (see
 * app/onboarding/actions.ts's connectSenderEmail comment) — only "smtp"
 * accounts can actually send today.
 */
export async function sendCampaignEmail(
  senderAccount: SendableSenderAccount,
  input: SendCampaignEmailInput
): Promise<void> {
  if (
    senderAccount.provider !== "smtp" ||
    !senderAccount.encrypted_credentials
  ) {
    throw new Error(
      "This sender account can't send yet — only custom SMTP accounts are supported."
    );
  }

  const credentials = JSON.parse(
    decryptCredential(senderAccount.encrypted_credentials)
  ) as SmtpCredentials;

  const transporter = nodemailer.createTransport({
    host: credentials.host,
    port: credentials.port,
    secure: credentials.port === 465,
    auth: { user: credentials.username, pass: credentials.password },
  });

  await transporter.sendMail({
    from: senderAccount.email_address,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
}
