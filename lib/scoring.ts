import type {
  OpportunityScoreBreakdown,
  SocialLinks,
} from "@/lib/types/domain";

export interface ScorableLead {
  websiteUrl: string | null;
  rating: number | null;
  reviewCount: number;
  businessHours: unknown | null;
  socialLinks: SocialLinks;
  hasSsl: boolean | null;
  isMobileFriendly: boolean | null;
}

/**
 * Weighted 0-100 Opportunity Score — see leadgen.md §4 step 4. Every point
 * value here is also the one shown in the marketing site's Opportunity
 * Score mockup (components/features/feature-mockups.tsx), so the product
 * and the pitch describe the same algorithm.
 */
export function calculateOpportunityScore(lead: ScorableLead): {
  score: number;
  breakdown: OpportunityScoreBreakdown;
} {
  const breakdown: OpportunityScoreBreakdown = {};

  if (!lead.websiteUrl) {
    breakdown.no_website = 25;
  } else {
    // These only apply when a website exists at all.
    if (lead.hasSsl === false) breakdown.no_ssl = 12;
    if (lead.isMobileFriendly === false)
      breakdown.poor_mobile_friendliness = 10;
  }

  if (lead.reviewCount === 0) {
    breakdown.low_review_count = 18;
  } else if (lead.reviewCount < 10) {
    breakdown.low_review_count = 12;
  } else if (lead.reviewCount < 25) {
    breakdown.low_review_count = 6;
  }

  if (lead.rating !== null) {
    if (lead.rating < 3.5) breakdown.low_rating = 15;
    else if (lead.rating < 4.0) breakdown.low_rating = 8;
  }

  if (!lead.businessHours) {
    breakdown.missing_hours = 9;
  }

  const hasAnySocial = Object.values(lead.socialLinks).some(Boolean);
  if (!hasAnySocial) {
    breakdown.no_social_presence = 11;
  }

  const score = Math.min(
    100,
    Object.values(breakdown).reduce<number>(
      (sum, points) => sum + (points ?? 0),
      0
    )
  );

  return { score, breakdown };
}
