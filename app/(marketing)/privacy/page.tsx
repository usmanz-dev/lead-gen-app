import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

const EFFECTIVE_DATE = "September 23, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Effective {EFFECTIVE_DATE}
      </p>

      <div className="text-muted-foreground mt-10 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-foreground text-base font-semibold">
            1. What we collect
          </h2>
          <p className="mt-2">
            When you create an account, we collect your name, email address, and
            organization details. When you use the product, we store the lead
            data you generate (business listings, scores, contact info),
            campaign content, and usage metrics needed to enforce your
            plan&apos;s limits. If you connect a sending mailbox, its
            credentials are encrypted before storage.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            2. How we use it
          </h2>
          <p className="mt-2">
            We use your data to operate the Service: running your lead searches,
            scoring and validating leads, generating outreach copy, sending
            campaigns on your behalf, billing your subscription, and providing
            support. We do not sell your data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            3. Third-party processors
          </h2>
          <p className="mt-2">
            We rely on a small set of subprocessors to run the Service: Supabase
            (database and authentication), Stripe (payments), Anthropic (AI
            email generation), and your own connected mailbox provider (for
            sending). Each only receives the data necessary to perform its
            function.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            4. Data about the businesses you contact
          </h2>
          <p className="mt-2">
            Lead records (business names, public contact details, review counts,
            etc.) are gathered from publicly available sources, not submitted by
            those businesses to us directly. If a business contacted through the
            Service wants a record removed, they — or you, on their behalf — can
            email us and we&apos;ll process the request.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            5. Data retention
          </h2>
          <p className="mt-2">
            We retain your account and organization data for as long as your
            account is active. If you delete your organization, its leads,
            campaigns, and related data are permanently removed.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            6. Your rights
          </h2>
          <p className="mt-2">
            You can access, correct, or delete your account data at any time
            from your account settings, or by emailing us. Depending on your
            jurisdiction, you may have additional rights under laws like the
            GDPR or CCPA — contact us and we&apos;ll help.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            7. Security
          </h2>
          <p className="mt-2">
            Every organization&apos;s data is isolated at the database level
            with row-level security, so one account can never read
            another&apos;s data. Sender mailbox credentials are encrypted at
            rest.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            8. Changes to this policy
          </h2>
          <p className="mt-2">
            If we make material changes to this policy, we&apos;ll notify
            account admins by email before the changes take effect.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-base font-semibold">
            9. Contact
          </h2>
          <p className="mt-2">
            Questions about this policy or your data can be sent to{" "}
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
