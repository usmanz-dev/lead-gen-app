// No "server-only" guard — the worker imports sendGmailMessage (via
// lib/campaign-email-sender.ts) to actually send through a connected
// Gmail/Workspace account, and that guard throws outside Next's bundler.
//
// Plain fetch calls to Google's REST endpoints rather than the
// `googleapis` SDK — this app only ever needs three calls (token
// exchange, token refresh, one Gmail send), so pulling in the full SDK's
// dependency weight for that isn't worth it.

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const USERINFO_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are not set. Add them to your .env.local file — see .env.example for where to get them."
    );
  }
  return { clientId, clientSecret };
}

export function getGoogleRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/api/oauth/google/callback`;
}

export function buildGoogleAuthUrl(state: string): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: `${GMAIL_SEND_SCOPE} ${USERINFO_EMAIL_SCOPE}`,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const { clientId, clientSecret } = getClientCredentials();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const data = (await response.json()) as TokenResponse;
  if (!response.ok || !data.refresh_token) {
    throw new Error(
      data.error_description ??
        "Google didn't return a refresh token — try disconnecting this app's access in your Google Account and connecting again."
    );
  }

  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<string> {
  const { clientId, clientSecret } = getClientCredentials();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  const data = (await response.json()) as TokenResponse;
  if (!response.ok) {
    throw new Error(
      data.error_description ?? "Couldn't refresh the Google access token."
    );
  }
  return data.access_token;
}

export async function getGoogleAccountEmail(
  accessToken: string
): Promise<string> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok)
    throw new Error("Couldn't read the connected Google account's email.");
  const data = (await response.json()) as { email?: string };
  if (!data.email)
    throw new Error("Google didn't return an email address for this account.");
  return data.email;
}

function encodeMimeMessage(
  from: string,
  to: string,
  subject: string,
  text: string
): string {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    text,
  ].join("\r\n");
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmailMessage(
  accessToken: string,
  input: { from: string; to: string; subject: string; text: string }
): Promise<void> {
  const raw = encodeMimeMessage(
    input.from,
    input.to,
    input.subject,
    input.text
  );

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(data?.error?.message ?? "Gmail rejected the send request.");
  }
}
