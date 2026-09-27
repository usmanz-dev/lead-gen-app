import type { OpportunityScoreBreakdown } from "@/lib/types/domain";

export interface MergeLeadData {
  businessName: string;
  category: string | null;
  opportunityScoreBreakdown: OpportunityScoreBreakdown;
}

const BREAKDOWN_PHRASES: Record<string, string> = {
  no_website: "no website",
  low_review_count: "very few reviews",
  low_rating: "a low rating",
  missing_hours: "no listed business hours",
  no_social_presence: "no social media presence",
  poor_mobile_friendliness: "a site that isn't mobile-friendly",
  no_ssl: "no SSL certificate on their site",
};

/**
 * Turns a lead's stored opportunity_score_breakdown into a short, readable
 * phrase for the {{opportunity_reason}} merge variable — the two highest-
 * weighted real factors, not a generic filler sentence.
 */
export function describeOpportunityReason(
  breakdown: OpportunityScoreBreakdown
): string {
  const factors = Object.entries(breakdown)
    .filter((entry): entry is [string, number] => entry[1] !== undefined)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => BREAKDOWN_PHRASES[key] ?? key.replace(/_/g, " "));

  if (factors.length === 0) return "room to strengthen their online presence";
  if (factors.length === 1) return factors[0];
  return `${factors[0]} and ${factors[1]}`;
}

const MERGE_TOKEN_PATTERN =
  /\{\{\s*(business_name|category|opportunity_reason)\s*\}\}/g;

export function renderTemplate(template: string, lead: MergeLeadData): string {
  return template.replace(MERGE_TOKEN_PATTERN, (_match, token: string) => {
    switch (token) {
      case "business_name":
        return lead.businessName;
      case "category":
        return lead.category ?? "local business";
      case "opportunity_reason":
        return describeOpportunityReason(lead.opportunityScoreBreakdown);
      default:
        return _match;
    }
  });
}

/** Step 2's "use a plain template instead" fallback — no AI call, and a
 * real, immediately usable starting point rather than a blank box. */
export const DEFAULT_PLAIN_TEMPLATE = {
  subject: "Quick idea for {{business_name}}",
  body: `Hi there,

I came across {{business_name}} and noticed {{opportunity_reason}} — that tends to cost local businesses real customers every month.

I help businesses fix exactly that. Worth a quick chat this week?

Best`,
};
