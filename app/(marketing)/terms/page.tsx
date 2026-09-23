import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

const EFFECTIVE_DATE = "September 23, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Effective {EFFECTIVE_DATE}
      </p>

      <div className="text-muted-foreground mt-10 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-foreground text-base font-semibold">
            1. Acceptance of terms
          </h2>
          <p className="mt-2">
            By creating an account or otherwise using LocalLeads AI (the
            &quot;Service&quot;), you agree to be bound by these Terms of
            Service. If you are using the Service on behalf of an organization,
            you are agreeing on behalf of that organization and you represent
            that you have the authority to do so.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            2. The service
          </h2>
          <p className="mt-2">
            LocalLeads AI provides tools for local business lead discovery, lead
            scoring, contact verification, AI-assisted outreach generation, and
            related reporting. Features, limits, and availability vary by
            subscription plan and may change over time as the Service evolves.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            3. Accounts
          </h2>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity that occurs under your
            account. You must provide accurate information when creating an
            account and keep it up to date.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            4. Acceptable use
          </h2>
          <p className="mt-2">
            You agree not to use the Service to send unsolicited bulk email in
            violation of applicable law (including CAN-SPAM, CASL, or GDPR), to
            scrape or harvest data in violation of a third party&apos;s terms of
            service, to harass or defraud any person, or to circumvent any usage
            limits associated with your plan. Every campaign email sent through
            the Service must include a working unsubscribe mechanism and
            accurate sender identification.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            5. Subscriptions &amp; billing
          </h2>
          <p className="mt-2">
            Paid plans are billed in advance on a recurring basis through our
            payment processor, Stripe. Usage limits (leads found, emails sent)
            reset at the start of each billing cycle and do not carry over. You
            may upgrade, downgrade, or cancel your subscription at any time from
            your account&apos;s billing settings; cancellation takes effect at
            the end of the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            6. Data &amp; third parties
          </h2>
          <p className="mt-2">
            Lead data is gathered from publicly available sources. You are
            solely responsible for how you use that data, including compliance
            with applicable data-protection and anti-spam laws in your
            jurisdiction and the jurisdictions of the businesses you contact.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            7. Disclaimer &amp; limitation of liability
          </h2>
          <p className="mt-2">
            The Service is provided &quot;as is&quot; without warranties of any
            kind. Because lead data is gathered via automated scraping, we do
            not guarantee its completeness or accuracy. To the maximum extent
            permitted by law, LocalLeads AI is not liable for indirect,
            incidental, or consequential damages arising from your use of the
            Service.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            8. Changes to these terms
          </h2>
          <p className="mt-2">
            We may update these terms from time to time. If we make material
            changes, we will notify account admins by email before the changes
            take effect.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            9. Contact
          </h2>
          <p className="mt-2">
            Questions about these terms can be sent to{" "}
            <a
              href="mailto:support@localleads.ai"
              className="text-primary hover:underline"
            >
              support@localleads.ai
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
