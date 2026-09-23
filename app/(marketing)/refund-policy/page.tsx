import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refund Policy" };

const EFFECTIVE_DATE = "September 23, 2026";

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Refund Policy</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Effective {EFFECTIVE_DATE}
      </p>

      <div className="text-muted-foreground mt-10 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-foreground text-base font-semibold">
            1. Monthly subscriptions
          </h2>
          <p className="mt-2">
            Subscriptions are billed at the start of each billing cycle. Because
            usage limits (leads found, emails sent) reset each cycle and
            don&apos;t carry over, we don&apos;t offer prorated refunds for
            unused usage within a cycle — but you can cancel at any time to stop
            future billing, and you keep access through the end of the cycle
            you&apos;ve already paid for.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            2. First-time subscribers
          </h2>
          <p className="mt-2">
            If you subscribe to a paid plan for the first time and it isn&apos;t
            working out, contact us within 7 days of your first charge and
            we&apos;ll issue a full refund for that charge, no questions asked.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            3. Annual billing
          </h2>
          <p className="mt-2">
            Annual plans are discounted roughly 20% versus paying monthly. If
            you cancel an annual plan, we&apos;ll refund the unused portion on a
            prorated monthly basis, minus any month(s) already used.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            4. Extra credits
          </h2>
          <p className="mt-2">
            One-off credit purchases (e.g. +500 emails) are non-refundable once
            consumed, but unused credit balances can be refunded within 7 days
            of purchase.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            5. Billing errors
          </h2>
          <p className="mt-2">
            If you believe you were charged in error — double-billed, or charged
            after a cancellation that should have taken effect — contact us and
            we&apos;ll investigate and correct it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            6. How to request a refund
          </h2>
          <p className="mt-2">
            Email{" "}
            <a
              href="mailto:support@localleads.ai"
              className="text-primary hover:underline"
            >
              support@localleads.ai
            </a>{" "}
            with your account email and the reason for the request. Approved
            refunds are returned to your original payment method via Stripe,
            typically within 5-10 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
