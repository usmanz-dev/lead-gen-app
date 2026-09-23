import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { getPlan, type PlanId } from "@/lib/plans";

/**
 * Keeps public.subscriptions in sync with Stripe. Runs with the service
 * role (there's no user session on a webhook request), and reads the raw
 * request body — required for Stripe's signature verification, so this
 * must never be parsed as JSON before constructEvent() sees it.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        error: `Invalid signature: ${error instanceof Error ? error.message : "unknown error"}`,
      },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organization_id;
      const plan = session.metadata?.plan as PlanId | undefined;

      if (organizationId && plan && session.subscription) {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await syncSubscription(
          supabase,
          organizationId,
          plan,
          stripeSubscription
        );
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      const organizationId = stripeSubscription.metadata?.organization_id;
      const plan = stripeSubscription.metadata?.plan as PlanId | undefined;

      if (organizationId && plan) {
        await syncSubscription(
          supabase,
          organizationId,
          plan,
          stripeSubscription
        );
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  plan: PlanId,
  stripeSubscription: Stripe.Subscription
) {
  const planDefinition = getPlan(plan);
  // current_period_start/end live on each subscription item, not the
  // subscription itself, since a subscription can hold multiple items with
  // independently billed periods — this plan always has exactly one.
  const item = stripeSubscription.items.data[0];
  const priceId = item?.price.id ?? null;

  await supabase.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      plan,
      status: mapStripeStatus(stripeSubscription.status),
      stripe_customer_id: stripeSubscription.customer as string,
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: priceId,
      current_period_start: item
        ? new Date(item.current_period_start * 1000).toISOString()
        : null,
      current_period_end: item
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      leads_limit: planDefinition.leadsLimit,
      emails_limit: planDefinition.emailsLimit,
    },
    { onConflict: "organization_id" }
  );
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "trialing" | "active" | "past_due" | "canceled" | "incomplete" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "incomplete";
  }
}
