"use server";

import { createClient } from "@/lib/supabase/server";
import type { CampaignStatus } from "@/lib/types/database.types";

async function requireOrganizationId(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  userId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("No organization found for your account.");

  return {
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
  };
}

export interface SenderAccountOption {
  id: string;
  emailAddress: string;
}

export async function listSenderAccounts(): Promise<SenderAccountOption[]> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { data, error } = await supabase
    .from("sender_accounts")
    .select("id, email_address")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Couldn't load sender accounts: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    emailAddress: row.email_address,
  }));
}

export interface CreateCampaignInput {
  name: string;
  senderAccountId?: string;
  scheduledAt?: string;
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name) throw new Error("Give the campaign a name.");
  const { supabase, organizationId, userId } = await requireOrganizationId();

  const status: CampaignStatus = input.scheduledAt ? "scheduled" : "draft";

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      organization_id: organizationId,
      created_by: userId,
      sender_account_id: input.senderAccountId || null,
      name,
      status,
      scheduled_at: input.scheduledAt || null,
    })
    .select("id")
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Couldn't create campaign.");
  return { id: data.id };
}

export async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus
): Promise<void> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { error } = await supabase
    .from("campaigns")
    .update({ status })
    .eq("id", campaignId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(`Couldn't update campaign: ${error.message}`);
}

export async function duplicateCampaign(
  campaignId: string
): Promise<{ id: string }> {
  const { supabase, organizationId, userId } = await requireOrganizationId();

  const { data: original, error: fetchError } = await supabase
    .from("campaigns")
    .select("name, sender_account_id")
    .eq("id", campaignId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (fetchError || !original) throw new Error("Campaign not found.");

  const { data: copy, error: createError } = await supabase
    .from("campaigns")
    .insert({
      organization_id: organizationId,
      created_by: userId,
      sender_account_id: original.sender_account_id,
      name: `${original.name} (Copy)`,
      status: "draft",
    })
    .select("id")
    .single();
  if (createError || !copy) {
    throw new Error(createError?.message ?? "Couldn't duplicate campaign.");
  }

  // Copy the target lead list, not the send history — a duplicate is a
  // fresh run against the same recipients, so every row starts at
  // "queued" with no timestamps.
  const { data: leads } = await supabase
    .from("campaign_leads")
    .select("lead_id")
    .eq("campaign_id", campaignId);

  if (leads && leads.length > 0) {
    await supabase
      .from("campaign_leads")
      .insert(
        leads.map((lead) => ({ campaign_id: copy.id, lead_id: lead.lead_id }))
      );
  }

  return { id: copy.id };
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  const { supabase, organizationId } = await requireOrganizationId();

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(`Couldn't delete campaign: ${error.message}`);
}
