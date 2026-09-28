import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is not set. Add it to your .env.local file."
    );
  }
  return secret;
}

interface OAuthStatePayload {
  organizationId: string;
  issuedAt: number;
}

/**
 * Stateless, HMAC-signed CSRF token for the Google OAuth redirect round
 * trip — no server-side session storage needed between "Connect
 * Gmail/Workspace" and Google's callback hitting us back.
 */
export function signOAuthState(organizationId: string): string {
  const payload: OAuthStatePayload = { organizationId, issuedAt: Date.now() };
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecret())
    .update(json)
    .digest("base64url");
  return `${json}.${signature}`;
}

export function verifyOAuthState(
  state: string
): { organizationId: string } | null {
  const [json, signature] = state.split(".");
  if (!json || !signature) return null;

  const expectedSignature = createHmac("sha256", getSecret())
    .update(json)
    .digest("base64url");
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(json, "base64url").toString("utf-8")
    ) as OAuthStatePayload;
    if (Date.now() - payload.issuedAt > STATE_TTL_MS) return null;
    return { organizationId: payload.organizationId };
  } catch {
    return null;
  }
}
