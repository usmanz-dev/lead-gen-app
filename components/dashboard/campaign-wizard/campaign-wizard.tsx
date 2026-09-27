"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { StepSelectLeads } from "@/components/dashboard/campaign-wizard/step-select-leads";
import { StepComposeMessage } from "@/components/dashboard/campaign-wizard/step-compose-message";
import { StepSender } from "@/components/dashboard/campaign-wizard/step-sender";
import { StepReviewSchedule } from "@/components/dashboard/campaign-wizard/step-review-schedule";
import {
  getWizardLeadSummaries,
  type WizardLeadSummary,
} from "@/app/(dashboard)/dashboard/campaigns/actions";

const STEP_LABELS = [
  "Select Leads",
  "Compose Message",
  "Sender",
  "Review & Schedule",
];
const TOTAL_STEPS = STEP_LABELS.length;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
};

export function CampaignWizard({ organizationId }: { organizationId: string }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [campaignName, setCampaignName] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Map<string, string>>(
    new Map()
  );
  const [sampleLead, setSampleLead] = useState<WizardLeadSummary | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const [offerDescription, setOfferDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [senderAccountId, setSenderAccountId] = useState<string | null>(null);
  const [senderEmail, setSenderEmail] = useState("");
  const [includeUnvalidatedEmails, setIncludeUnvalidatedEmails] =
    useState(false);

  function addLead(lead: { id: string; name: string }) {
    setSelectedLeads((prev) => {
      const next = new Map(prev);
      next.set(lead.id, lead.name);
      return next;
    });
  }

  function removeLead(id: string) {
    setSelectedLeads((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  async function goToStep(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1);
    if (nextStep === 1 && step === 0) {
      setIsLoadingSample(true);
      const firstId = Array.from(selectedLeads.keys())[0];
      try {
        const summaries = firstId
          ? await getWizardLeadSummaries([firstId])
          : [];
        setSampleLead(summaries[0] ?? null);
      } finally {
        setIsLoadingSample(false);
      }
    }
    setStep(nextStep);
  }

  return (
    <div className="border-border bg-card w-full max-w-3xl rounded-xl border p-6 shadow-sm sm:p-8">
      <div className="mb-6 space-y-1.5">
        <Label htmlFor="campaign-name">Campaign name</Label>
        <Input
          id="campaign-name"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="e.g. Dentists — Karachi outreach"
        />
      </div>

      <OnboardingProgress
        current={step}
        total={TOTAL_STEPS}
        label={STEP_LABELS[step]}
      />

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {step === 0 && (
              <StepSelectLeads
                selectedLeads={selectedLeads}
                onAdd={addLead}
                onRemove={removeLead}
                onNext={() => goToStep(1)}
              />
            )}
            {step === 1 &&
              (isLoadingSample ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : (
                <StepComposeMessage
                  sampleLead={sampleLead}
                  offerDescription={offerDescription}
                  subject={subject}
                  body={body}
                  onOfferDescriptionChange={setOfferDescription}
                  onSubjectChange={setSubject}
                  onBodyChange={setBody}
                  onBack={() => goToStep(0)}
                  onNext={() => goToStep(2)}
                />
              ))}
            {step === 2 && (
              <StepSender
                organizationId={organizationId}
                recipientCount={selectedLeads.size}
                senderAccountId={senderAccountId}
                onSenderAccountChange={(account) => {
                  setSenderAccountId(account.id);
                  setSenderEmail(account.emailAddress);
                }}
                onBack={() => goToStep(1)}
                onNext={() => goToStep(3)}
              />
            )}
            {step === 3 && senderAccountId && (
              <StepReviewSchedule
                campaignName={campaignName}
                leadIds={Array.from(selectedLeads.keys())}
                sampleLead={sampleLead}
                subject={subject}
                body={body}
                senderAccountId={senderAccountId}
                senderEmail={senderEmail}
                includeUnvalidatedEmails={includeUnvalidatedEmails}
                onIncludeUnvalidatedChange={setIncludeUnvalidatedEmails}
                onBack={() => goToStep(2)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
