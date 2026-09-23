import { NextResponse } from "next/server";
import { getEmailTransporter } from "@/lib/email";
import { contactSchema } from "@/lib/validations/contact";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  // Honeypot — a hidden field real users never fill in. Bots that
  // auto-fill every input trip it; pretend success without sending mail.
  if (
    typeof body === "object" &&
    body !== null &&
    "company" in body &&
    typeof (body as { company?: unknown }).company === "string" &&
    (body as { company: string }).company.length > 0
  ) {
    return NextResponse.json({ success: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
      { status: 400 }
    );
  }

  const { name, email, message } = parsed.data;

  let transporter;
  try {
    transporter = getEmailTransporter();
  } catch (error) {
    console.error("Contact form: email transport not configured:", error);
    return NextResponse.json(
      {
        error:
          "Sorry, the contact form isn't set up to send mail yet. Please email support@localleads.ai directly.",
      },
      { status: 500 }
    );
  }

  const fromAddress = process.env.SMTP_USER!;
  const inboxAddress = process.env.CONTACT_INBOX_EMAIL || fromAddress;

  try {
    await transporter.sendMail({
      from: `"LocalLeads AI Contact Form" <${fromAddress}>`,
      to: inboxAddress,
      replyTo: `"${name}" <${email}>`,
      subject: `New contact form message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    });
  } catch (error) {
    console.error("Contact form: failed to send email:", error);
    return NextResponse.json(
      {
        error:
          "We couldn't send your message right now. Please try again, or email support@localleads.ai directly.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
