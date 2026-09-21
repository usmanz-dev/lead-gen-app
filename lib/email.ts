import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

/**
 * Server-only Nodemailer transport for transactional email (password
 * resets, notifications). Campaign sending (leadgen.md §5 "Outreach") uses
 * per-organization sender accounts (Gmail/Workspace OAuth or custom SMTP)
 * connected by the user, not this shared transport.
 *
 * TODO(Phase 4 — Contact & Outreach): add the per-org sender account
 * transport used by the Bulk Sending Engine.
 */
export function getEmailTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD must all be set. Add them to your .env.local file."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  return transporter;
}
