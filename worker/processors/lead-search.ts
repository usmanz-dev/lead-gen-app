import { createAdminClient } from "@/lib/supabase/admin";
import { calculateOpportunityScore } from "@/lib/scoring";
import {
  scrapeGoogleMaps,
  type ScrapedLead,
} from "@/worker/scrapers/google-maps";
import { findWebsiteContactInfo } from "@/worker/scrapers/website-contact";
import type { LeadSearchJobData } from "@/lib/jobs/lead-search";
import type { SocialLinks } from "@/lib/types/domain";
import type { Json } from "@/lib/types/database.types";

const CONTACT_LOOKUP_CONCURRENCY = 5;
const MAX_RESULTS = 60;

/**
 * Runs one lead-search job end to end: scrape Google Maps, look up each
 * result's website for an email/social links, score every lead, write
 * everything to public.leads, and keep public.searches (status,
 * leads_found, error_message) in sync throughout — that row is what the
 * search page's progress polling and history list read from.
 */
export async function processLeadSearchJob(
  data: LeadSearchJobData
): Promise<void> {
  const { searchId, organizationId, keyword, location, filters } = data;
  const supabase = createAdminClient();

  await supabase
    .from("searches")
    .update({ status: "running" })
    .eq("id", searchId);

  try {
    const scraped = await scrapeGoogleMaps({
      keyword,
      location,
      filters,
      maxResults: MAX_RESULTS,
      onProgress: async (found) => {
        await supabase
          .from("searches")
          .update({ leads_found: found })
          .eq("id", searchId);
      },
    });

    if (scraped.length === 0) {
      await supabase
        .from("searches")
        .update({
          status: "failed",
          leads_found: 0,
          error_message:
            "No businesses found for this search. Try a broader keyword or a different location.",
        })
        .eq("id", searchId);
      return;
    }

    const enriched = await enrichWithContactInfo(scraped);

    const rows = enriched.map((lead) => {
      const { score, breakdown } = calculateOpportunityScore({
        websiteUrl: lead.websiteUrl,
        rating: lead.rating,
        reviewCount: lead.reviewCount,
        businessHours: lead.hoursStatus,
        socialLinks: lead.socialLinks,
        hasSsl: lead.websiteUrl ? lead.hasSsl : null,
        // Checking real mobile-friendliness would mean rendering every
        // lead's site in a second browser context per lead — too slow for
        // a batch this size, so this factor is left unscored rather than
        // guessed.
        isMobileFriendly: null,
      });

      return {
        organization_id: organizationId,
        search_id: searchId,
        name: lead.name,
        category: lead.category,
        phone: lead.phone,
        address: lead.address,
        rating: lead.rating,
        review_count: lead.reviewCount,
        website_url: lead.websiteUrl,
        google_maps_url: lead.googleMapsUrl,
        business_hours: lead.hoursStatus ? { status: lead.hoursStatus } : null,
        email: lead.email,
        email_validation_status: "unknown" as const,
        social_links: lead.socialLinks as unknown as Json,
        opportunity_score: score,
        opportunity_score_breakdown: breakdown,
      };
    });

    const { error: insertError } = await supabase.from("leads").insert(rows);
    if (insertError) {
      throw new Error(`Failed to save leads: ${insertError.message}`);
    }

    await supabase
      .from("searches")
      .update({ status: "completed", leads_found: rows.length })
      .eq("id", searchId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The search failed unexpectedly. Please try again.";

    await supabase
      .from("searches")
      .update({ status: "failed", error_message: message })
      .eq("id", searchId);

    // Re-throw so BullMQ records the job as failed too (visible in any
    // queue-monitoring UI), not just in our own searches table.
    throw error;
  }
}

interface EnrichedLead extends ScrapedLead {
  email: string | null;
  socialLinks: SocialLinks;
  hasSsl: boolean;
}

async function enrichWithContactInfo(
  leads: ScrapedLead[]
): Promise<EnrichedLead[]> {
  const enriched: EnrichedLead[] = [];

  for (let i = 0; i < leads.length; i += CONTACT_LOOKUP_CONCURRENCY) {
    const batch = leads.slice(i, i + CONTACT_LOOKUP_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (lead) => {
        if (!lead.websiteUrl) {
          return { ...lead, email: null, socialLinks: {}, hasSsl: false };
        }
        const contact = await findWebsiteContactInfo(lead.websiteUrl);
        return { ...lead, ...contact };
      })
    );
    enriched.push(...batchResults);
  }

  return enriched;
}
