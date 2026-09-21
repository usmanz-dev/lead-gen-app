import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Server-only Stripe client, lazily created so pages that don't touch
 * billing don't fail just because STRIPE_SECRET_KEY isn't set yet.
 *
 * TODO(Phase 5 — Monetization): wire this into Checkout Sessions, the
 * Customer Portal, and webhook handling per leadgen.md §13.
 */
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your .env.local file."
    );
  }

  stripeClient = new Stripe(secretKey, { typescript: true });
  return stripeClient;
}
