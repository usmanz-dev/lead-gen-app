"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { encryptCredential } from "@/lib/crypto";
import type { BusinessType } from "@/lib/types/database.types";

export interface OnboardingStepPatch {
  business_type?: BusinessType;
  target_industries?: string[];
  target_locations?: string[];
  onboarding_step: number;
}

/**
 * Persists one wizard step's answer and advances the resume pointer.
 * RLS (organization_id must be one of the caller's orgs) is what actually
 * prevents writing to someone else's organization — this runs with the
 * user's own session, not the service role.
 */
export async function saveOnboardingStep(
  organizationId: string,
  patch: OnboardingStepPatch
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update(patch)
    .eq("id", organizationId);

  if (error) {
    throw new Error(`Couldn't save your progress: ${error.message}`);
  }
}

export interface ConnectSenderEmailInput {
  emailAddress: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
}

/**
 * The wizard's "Connect Email" step uses custom SMTP — full Gmail/Workspace
 * OAuth for *sending* mail needs its own Google Cloud OAuth client (gmail.send
 * scope, separate from the "Continue with Google" sign-in provider already
 * configured in Supabase), which nothing in this project has registered yet.
 * SMTP is the one path here that's real today rather than a fake button.
 */
export async function connectSenderEmail(
  organizationId: string,
  input: ConnectSenderEmailInput
) {
  const supabase = await createClient();

  const encryptedCredentials = encryptCredential(
    JSON.stringify({
      host: input.smtpHost,
      port: input.smtpPort,
      username: input.smtpUsername,
      password: input.smtpPassword,
    })
  );

  const { error } = await supabase.from("sender_accounts").insert({
    organization_id: organizationId,
    email_address: input.emailAddress,
    provider: "smtp",
    encrypted_credentials: encryptedCredentials,
  });

  if (error) {
    throw new Error(`Couldn't connect that email: ${error.message}`);
  }
}

export async function completeOnboarding(organizationId: string) {
  const supabase = await createClient();
  await supabase
    .from("organizations")
    .update({ onboarding_completed: true })
    .eq("id", organizationId);

  redirect("/dashboard");
}
