import "server-only";
import Stripe from "stripe";
import type { BillingInterval, PlanId } from "@/lib/plans";

let stripeClient: Stripe | null = null;

/**
 * Server-only Stripe client, lazily created so pages that don't touch
 * billing don't fail just because STRIPE_SECRET_KEY isn't set yet.
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

const PRICE_ENV_KEYS: Record<PlanId, Record<BillingInterval, string>> = {
  starter: {
    monthly: "STRIPE_PRICE_STARTER_MONTHLY",
    annual: "STRIPE_PRICE_STARTER_ANNUAL",
  },
  growth: {
    monthly: "STRIPE_PRICE_GROWTH_MONTHLY",
    annual: "STRIPE_PRICE_GROWTH_ANNUAL",
  },
  pro: {
    monthly: "STRIPE_PRICE_PRO_MONTHLY",
    annual: "STRIPE_PRICE_PRO_ANNUAL",
  },
  agency: {
    monthly: "STRIPE_PRICE_AGENCY_MONTHLY",
    annual: "STRIPE_PRICE_AGENCY_ANNUAL",
  },
};

/**
 * Looks up the Stripe Price id for a plan + billing interval. Throws a
 * clear, specific error (which app/checkout/page.tsx surfaces to the user)
 * rather than silently failing when a price hasn't been created in Stripe
 * and configured here yet.
 */
export function getStripePriceId(
  plan: PlanId,
  interval: BillingInterval
): string {
  const envKey = PRICE_ENV_KEYS[plan][interval];
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(
      `${envKey} is not set. Create this recurring price in your Stripe dashboard and add its id to .env.local.`
    );
  }
  return priceId;
}
