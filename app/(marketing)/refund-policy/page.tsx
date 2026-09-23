import type { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/legal/legal-page-layout";

export const metadata: Metadata = { title: "Refund Policy" };

const LAST_UPDATED = "September 26, 2026";

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection heading="1. 14-day money-back guarantee">
        <p>
          If you subscribe to a paid plan for the first time and it isn&apos;t
          the right fit, contact us within 14 days of your first payment and
          we&apos;ll issue a full refund for that charge, no questions asked.
          This guarantee applies once per customer, to your first payment on
          your first paid plan only.
        </p>
      </LegalSection>

      <LegalSection heading="2. Monthly subscriptions after the guarantee period">
        <p>
          Outside the 14-day guarantee, subscriptions are billed at the start of
          each billing cycle. Because usage limits (leads found, emails sent)
          reset each cycle and don&apos;t carry over, we don&apos;t offer
          prorated refunds for unused usage within a cycle — but you can cancel
          at any time to stop future billing, and you keep access through the
          end of the cycle you&apos;ve already paid for.
        </p>
      </LegalSection>

      <LegalSection heading="3. Annual billing">
        <p>
          Annual plans are discounted roughly 20% versus paying monthly. Beyond
          the 14-day guarantee, if you cancel an annual plan we&apos;ll refund
          the unused portion on a prorated monthly basis, minus any month(s)
          already used.
        </p>
      </LegalSection>

      <LegalSection heading="4. Extra credits">
        <p>
          One-off credit purchases (e.g. +500 emails) are non-refundable once
          consumed, but unused credit balances can be refunded within 14 days of
          purchase.
        </p>
      </LegalSection>

      <LegalSection heading="5. Billing errors">
        <p>
          If you believe you were charged in error — double-billed, or charged
          after a cancellation that should have taken effect — contact us and
          we&apos;ll investigate and correct it promptly, regardless of when it
          happened.
        </p>
      </LegalSection>

      <LegalSection heading="6. How to request a refund">
        <p>
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
      </LegalSection>
    </LegalPageLayout>
  );
}
