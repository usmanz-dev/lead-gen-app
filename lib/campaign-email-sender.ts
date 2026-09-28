// No "server-only" guard — the standalone worker process imports this to
// actually send campaign emails, and that guard throws outside Next's own
// bundler (same reasoning as lib/queue-names.ts and lib/supabase/admin.ts).
import nodemailer from "nodemailer";
import { decryptCredential } from "@/lib/crypto";
import { refreshGoogleAccessToken, sendGmailMessage } from "@/lib/google-oauth";

interface SmtpCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface GoogleCredentials {
  refreshToken: string;
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
 * Sends one real email through a connected sender account — either its
 * own SMTP credentials or, for a Gmail/Workspace account, the real
 * Gmail API using the stored OAuth refresh token. Used both by the
 * worker (actual campaign sends) and by "Send test email to myself" /
 * the Sender Settings connect flow, so a test really goes out through
 * the same path production sends use.
 */
export async function sendCampaignEmail(
  senderAccount: SendableSenderAccount,
  input: SendCampaignEmailInput
): Promise<void> {
  if (!senderAccount.encrypted_credentials) {
    throw new Error("This sender account has no stored credentials.");
  }

  if (senderAccount.provider === "gmail") {
    const { refreshToken } = JSON.parse(
      decryptCredential(senderAccount.encrypted_credentials)
    ) as GoogleCredentials;
    const accessToken = await refreshGoogleAccessToken(refreshToken);
    await sendGmailMessage(accessToken, {
      from: senderAccount.email_address,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return;
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
