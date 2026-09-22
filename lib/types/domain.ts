/**
 * Typed shapes for the jsonb columns in database.types.ts. The database
 * only knows those columns as `Json` — these narrower types are for the
 * application code that reads/writes them.
 */

/** leads.opportunity_score_breakdown — see leadgen.md §4 step 4. */
export interface OpportunityScoreBreakdown {
  no_website?: number;
  low_review_count?: number;
  low_rating?: number;
  missing_hours?: number;
  no_social_presence?: number;
  poor_mobile_friendliness?: number;
  no_ssl?: number;
  [factor: string]: number | undefined;
}

/** searches.filters */
export interface SearchFilters {
  min_rating?: number;
  has_website?: boolean;
  min_review_count?: number;
}

/** leads.business_hours — keyed by lowercase weekday. */
export type BusinessHours = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    { open: string; close: string } | "closed"
  >
>;

/** leads.social_links */
export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  x?: string;
}

/** rank_tracker_jobs.grid_points — one lat/lng sample point in the grid. */
export interface RankTrackerGridPoint {
  lat: number;
  lng: number;
}

/** rank_tracker_jobs.results_history — one entry per scheduled run. */
export interface RankTrackerResult {
  checked_at: string;
  points: Array<{ lat: number; lng: number; rank: number | null }>;
}

/** reports.branding_settings */
export interface ReportBrandingSettings {
  logo_url?: string;
  brand_color?: string;
  agency_name?: string;
  agency_contact_email?: string;
}
