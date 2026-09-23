import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getStripePriceId } from "@/lib/stripe";
import { isPlanId, isBillingInterval } from "@/lib/plans";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Checkout" };

// Always creates a fresh Stripe Checkout Session — never prerender.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string; interval?: string };
}) {
  const plan = isPlanId(searchParams.plan) ? searchParams.plan : "pro";
  const interval = isBillingInterval(searchParams.interval)
    ? searchParams.interval
    : "monthly";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/checkout?plan=${plan}&interval=${interval}`)}`
    );
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let organizationId = membership?.organization_id ?? null;

  // Safety net for the Google OAuth path (and any account that reaches
  // here before signup's own org insert has run): don't strand the user
  // over a missing organization when they're trying to pay.
  if (!organizationId) {
    const firstName =
      (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
      "New";
    const { data: newOrg } = await supabase
      .from("organizations")
      .insert({ name: `${firstName}'s Organization` })
      .select("id")
      .single();
    organizationId = newOrg?.id ?? null;
  }

  if (!organizationId) redirect("/onboarding");

  let checkoutUrl: string;
  try {
    const priceId = getStripePriceId(plan, interval);
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(existingSubscription?.stripe_customer_id
        ? { customer: existingSubscription.stripe_customer_id }
        : { customer_email: user.email }),
      success_url: `${appUrl}/onboarding?checkout=success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { organization_id: organizationId, plan },
      subscription_data: {
        metadata: { organization_id: organizationId, plan },
      },
    });

    if (!session.url) {
      throw new Error("Stripe didn't return a checkout URL.");
    }
    checkoutUrl = session.url;
  } catch (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">
          Checkout isn&apos;t available right now
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {error instanceof Error ? error.message : "Please try again later."}
        </p>
        <Button className="mt-6" render={<Link href="/dashboard" />}>
          Go to dashboard
        </Button>
      </div>
    );
  }

  redirect(checkoutUrl);
}
