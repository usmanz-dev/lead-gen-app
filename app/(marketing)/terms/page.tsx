import type { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/legal/legal-page-layout";

export const metadata: Metadata = { title: "Terms of Service" };

const LAST_UPDATED = "September 26, 2026";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <LegalSection heading="1. Acceptance of terms">
        <p>
          By creating an account or otherwise using LocalLeads AI (the
          &quot;Service&quot;), you agree to be bound by these Terms of Service.
          If you are using the Service on behalf of an organization, you are
          agreeing on behalf of that organization and you represent that you
          have the authority to do so.
        </p>
      </LegalSection>

      <LegalSection heading="2. The service">
        <p>
          LocalLeads AI provides tools for local business lead discovery, lead
          scoring, contact verification, AI-assisted outreach generation, and
          related reporting. Features, limits, and availability vary by
          subscription plan and may change over time as the Service evolves.
        </p>
      </LegalSection>

      <LegalSection heading="3. Accounts">
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activity that occurs under your
          account. You must provide accurate information when creating an
          account and keep it up to date.
        </p>
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>
          You agree not to use the Service to send unsolicited bulk email in
          violation of applicable law (including CAN-SPAM, CASL, or GDPR), to
          scrape or harvest data in violation of a third party&apos;s terms of
          service, to harass or defraud any person, or to circumvent any usage
          limits associated with your plan. Every campaign email sent through
          the Service must include a working unsubscribe mechanism and accurate
          sender identification.
        </p>
      </LegalSection>

      <LegalSection heading="5. Subscriptions & billing">
        <p>
          Paid plans are billed in advance on a recurring basis through our
          payment processor, Stripe. Usage limits (leads found, emails sent)
          reset at the start of each billing cycle and do not carry over. You
          may upgrade, downgrade, or cancel your subscription at any time from
          your account&apos;s billing settings; cancellation takes effect at the
          end of the current billing period. See our{" "}
          <a href="/refund-policy" className="text-primary hover:underline">
            Refund Policy
          </a>{" "}
          for details on refunds, including the 14-day money-back guarantee on
          your first payment.
        </p>
      </LegalSection>

      <LegalSection heading="6. Fair use policy">
        <p>
          Plans described as &quot;Unlimited&quot; (currently the Agency plan)
          are not literally unlimited. To keep the Service fast and reliable for
          every customer, unlimited plans carry a reasonable-use cap on leads
          and emails, enforced automatically in our billing system rather than
          advertised as a specific number.
        </p>
        <p>
          This cap is set generously, well above what a typical agency on that
          plan actually uses, and the large majority of Agency customers never
          come close to it. If your usage pattern looks unusual, we will reach
          out to discuss it with you before taking any action — we will never
          silently throttle, suspend, or downgrade your account without
          contacting you first.
        </p>
      </LegalSection>

      <LegalSection heading="7. Data & third parties">
        <p>
          Lead data is gathered from publicly available sources. You are solely
          responsible for how you use that data, including compliance with
          applicable data-protection and anti-spam laws in your jurisdiction and
          the jurisdictions of the businesses you contact.
        </p>
      </LegalSection>

      <LegalSection heading="8. Disclaimer & limitation of liability">
        <p>
          The Service is provided &quot;as is&quot; without warranties of any
          kind. Because lead data is gathered via automated scraping, we do not
          guarantee its completeness or accuracy. To the maximum extent
          permitted by law, LocalLeads AI is not liable for indirect,
          incidental, or consequential damages arising from your use of the
          Service.
        </p>
      </LegalSection>

      <LegalSection heading="9. Changes to these terms">
        <p>
          We may update these terms from time to time. If we make material
          changes, we will notify account admins by email before the changes
          take effect.
        </p>
      </LegalSection>

      <LegalSection heading="10. Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a
            href="mailto:support@localleads.ai"
            className="text-primary hover:underline"
          >
            support@localleads.ai
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
