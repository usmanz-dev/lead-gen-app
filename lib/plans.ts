export type PlanId = "starter" | "growth" | "pro" | "agency";
export type BillingInterval = "monthly" | "annual";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  /** Per-month equivalent when billed annually (~20% off monthlyPrice). */
  annualMonthlyPrice: number;
  leadsLimit: number;
  emailsLimit: number;
  features: string[];
  featured?: boolean;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 19,
    annualMonthlyPrice: 15,
    leadsLimit: 500,
    emailsLimit: 500,
    features: [
      "500 leads/mo",
      "500 emails/mo",
      "Basic AI email templates",
      "1 team seat",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 49,
    annualMonthlyPrice: 39,
    leadsLimit: 2500,
    emailsLimit: 3500,
    features: [
      "2,500 leads/mo",
      "3,500 emails/mo",
      "Full AI email generation",
      "1 rank tracker keyword",
      "3 team seats",
      "Priority email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 89,
    annualMonthlyPrice: 71,
    leadsLimit: 8000,
    emailsLimit: 10000,
    features: [
      "8,000 leads/mo",
      "10,000 emails/mo",
      "Full AI email generation",
      "5 rank tracker keywords",
      "White-label reports",
      "5 team seats",
      "Priority email support",
    ],
    featured: true,
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 149,
    annualMonthlyPrice: 119,
    // "Unlimited" is never literally unlimited (leadgen.md §14) — this is
    // the internal, non-customer-facing fair-use ceiling.
    leadsLimit: 50000,
    emailsLimit: 50000,
    features: [
      "Unlimited* leads/mo",
      "Unlimited* emails/mo",
      "Full AI email generation",
      "Unlimited rank tracker",
      "White-label reports",
      "10 team seats",
      "Dedicated priority support",
    ],
  },
];

export function getPlan(id: PlanId): PlanDefinition {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function isPlanId(value: string | undefined | null): value is PlanId {
  return (
    value === "starter" ||
    value === "growth" ||
    value === "pro" ||
    value === "agency"
  );
}

export function isBillingInterval(
  value: string | undefined | null
): value is BillingInterval {
  return value === "monthly" || value === "annual";
}
