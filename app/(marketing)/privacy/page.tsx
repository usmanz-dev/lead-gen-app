import type { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/legal/legal-page-layout";

export const metadata: Metadata = { title: "Privacy Policy" };

const LAST_UPDATED = "September 26, 2026";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection heading="1. What we collect">
        <p>
          When you create an account, we collect your name, email address, and
          organization details. When you use the product, we store the lead data
          you generate (business listings, scores, contact info), campaign
          content, and usage metrics needed to enforce your plan&apos;s limits.
          If you connect a sending mailbox, its credentials are encrypted before
          storage.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use it">
        <p>
          We use your data to operate the Service: running your lead searches,
          scoring and validating leads, generating outreach copy, sending
          campaigns on your behalf, billing your subscription, and providing
          support. We do not sell your data to third parties.
        </p>
      </LegalSection>

      <LegalSection heading="3. Third-party processors">
        <p>
          We rely on a small set of subprocessors to run the Service: Supabase
          (database and authentication), Stripe (payments), Anthropic (AI email
          generation), and your own connected mailbox provider (for sending).
          Each only receives the data necessary to perform its function.
        </p>
      </LegalSection>

      <LegalSection heading="4. Data about the businesses you contact">
        <p>
          Lead records (business names, public contact details, review counts,
          etc.) are gathered from publicly available sources, not submitted by
          those businesses to us directly. If a business contacted through the
          Service wants a record removed, they — or you, on their behalf — can
          email us and we&apos;ll process the request.
        </p>
      </LegalSection>

      <LegalSection heading="5. Data retention">
        <p>
          We retain your account and organization data for as long as your
          account is active. If you delete your organization, its leads,
          campaigns, and related data are permanently removed.
        </p>
      </LegalSection>

      <LegalSection heading="6. Your rights">
        <p>
          You can access, correct, or delete your account data at any time from
          your account settings, or by emailing us. Depending on your
          jurisdiction, you may have additional rights under laws like the GDPR
          or CCPA — contact us and we&apos;ll help.
        </p>
      </LegalSection>

      <LegalSection heading="7. Security">
        <p>
          Every organization&apos;s data is isolated at the database level with
          row-level security, so one account can never read another&apos;s data.
          Sender mailbox credentials are encrypted at rest.
        </p>
      </LegalSection>

      <LegalSection heading="8. Changes to this policy">
        <p>
          If we make material changes to this policy, we&apos;ll notify account
          admins by email before the changes take effect.
        </p>
      </LegalSection>

      <LegalSection heading="9. Contact">
        <p>
          Questions about this policy or your data can be sent to{" "}
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
