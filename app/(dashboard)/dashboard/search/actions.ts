"use server";

import { createClient } from "@/lib/supabase/server";
import { getQueue, QUEUE_NAMES } from "@/lib/queue";
import { getUsageSummary } from "@/lib/dashboard";
import {
  leadSearchSchema,
  type LeadSearchFormInput,
} from "@/lib/validations/lead-search";
import type {
  LeadSearchFilters,
  LeadSearchJobData,
} from "@/lib/jobs/lead-search";
import type { Json } from "@/lib/types/database.types";

export interface StartLeadSearchResult {
  searchId: string;
}

/**
 * Creates the `searches` row (status "pending") and enqueues the real
 * BullMQ job the standalone worker picks up — this runs with the caller's
 * own session, so RLS (not the service role) is what scopes the insert to
 * their organization. The worker (worker/processors/lead-search.ts) is
 * what actually drives status from pending -> running -> completed/failed
 * as it scrapes; the search page polls that row for progress.
 */
export async function startLeadSearch(
  input: LeadSearchFormInput
): Promise<StartLeadSearchResult> {
  const parsed = leadSearchSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid search input");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You need to be signed in to start a search.");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) {
    throw new Error("No organization found for your account.");
  }
  const organizationId = membership.organization_id;

  const usage = await getUsageSummary(organizationId);
  if (usage.leadsUsed >= usage.leadsLimit) {
    throw new Error(
      `You've used all ${usage.leadsLimit.toLocaleString()} leads on your ${usage.plan} plan this cycle. Upgrade your plan to keep searching.`
    );
  }

  const filters: LeadSearchFilters = {
    minRating: values.minRating,
    minReviewCount: values.minReviewCount,
    hasWebsite: values.hasWebsite || undefined,
    noWebsiteOnly: values.noWebsiteOnly || undefined,
  };

  const { data: search, error: insertError } = await supabase
    .from("searches")
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      keyword: values.keyword,
      location: values.location,
      filters: filters as unknown as Json,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !search) {
    throw new Error(
      insertError?.message ?? "Couldn't create the search. Please try again."
    );
  }

  const jobData: LeadSearchJobData = {
    searchId: search.id,
    organizationId,
    keyword: values.keyword,
    location: values.location,
    filters,
  };

  try {
    await getQueue(QUEUE_NAMES.leadSearch).add("lead-search", jobData);
  } catch (queueError) {
    const message =
      queueError instanceof Error
        ? queueError.message
        : "Couldn't reach the search queue.";
    await supabase
      .from("searches")
      .update({ status: "failed", error_message: message })
      .eq("id", search.id);
    throw new Error(
      "Couldn't start the search right now. Please try again in a moment."
    );
  }

  return { searchId: search.id };
}
