"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(organizationId: string) {
  const supabase = await createClient();
  await supabase
    .from("organizations")
    .update({ onboarding_completed: true })
    .eq("id", organizationId);

  redirect("/dashboard");
}
