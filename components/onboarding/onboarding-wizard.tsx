"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  saveOnboardingStep,
  completeOnboarding,
} from "@/app/onboarding/actions";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { BusinessTypeStep } from "@/components/onboarding/steps/business-type-step";
import { IndustriesStep } from "@/components/onboarding/steps/industries-step";
import { LocationsStep } from "@/components/onboarding/steps/locations-step";
import { ConnectEmailStep } from "@/components/onboarding/steps/connect-email-step";
import { FinishStep } from "@/components/onboarding/steps/finish-step";
import type { BusinessType } from "@/lib/types/database.types";

const STEP_LABELS = [
  "Business type",
  "Industries",
  "Locations",
  "Sending email",
  "Done",
];
const TOTAL_STEPS = STEP_LABELS.length;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
};

export interface OnboardingWizardProps {
  organizationId: string;
  firstName: string;
  initialStep: number;
  initialBusinessType: BusinessType | null;
  initialIndustries: string[];
  initialLocations: string[];
  initialSenderEmail: string | null;
}

export function OnboardingWizard({
  organizationId,
  firstName,
  initialStep,
  initialBusinessType,
  initialIndustries,
  initialLocations,
  initialSenderEmail,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(
    Math.min(Math.max(initialStep, 0), TOTAL_STEPS - 1)
  );
  const [direction, setDirection] = useState(1);
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [industries, setIndustries] = useState(initialIndustries);
  const [locations, setLocations] = useState(initialLocations);
  const [senderEmail, setSenderEmail] = useState(initialSenderEmail);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function advance(
    nextStep: number,
    patch: Record<string, unknown> = {}
  ) {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveOnboardingStep(organizationId, {
        ...patch,
        onboarding_step: nextStep,
      });
      setDirection(1);
      setStep(nextStep);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Couldn't save your progress."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleFinish() {
    setIsFinishing(true);
    await completeOnboarding(organizationId);
  }

  return (
    <div className="border-border bg-card w-[92%] max-w-2xl rounded-xl border p-6 shadow-sm sm:p-8">
      <OnboardingProgress
        current={step}
        total={TOTAL_STEPS}
        label={STEP_LABELS[step]}
      />

      {saveError && (
        <p className="text-destructive mb-4 text-sm" role="alert">
          {saveError}
        </p>
      )}

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
              <BusinessTypeStep
                value={businessType}
                isSaving={isSaving}
                onNext={(value) => {
                  setBusinessType(value);
                  advance(1, { business_type: value });
                }}
              />
            )}
            {step === 1 && (
              <IndustriesStep
                value={industries}
                isSaving={isSaving}
                onBack={goBack}
                onNext={(value) => {
                  setIndustries(value);
                  advance(2, { target_industries: value });
                }}
              />
            )}
            {step === 2 && (
              <LocationsStep
                value={locations}
                isSaving={isSaving}
                onBack={goBack}
                onNext={(value) => {
                  setLocations(value);
                  advance(3, { target_locations: value });
                }}
              />
            )}
            {step === 3 && (
              <ConnectEmailStep
                organizationId={organizationId}
                connectedEmail={senderEmail}
                isSaving={isSaving}
                onBack={goBack}
                onConnected={setSenderEmail}
                onNext={() => advance(4)}
              />
            )}
            {step === 4 && (
              <FinishStep
                firstName={firstName}
                isFinishing={isFinishing}
                onFinish={handleFinish}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
