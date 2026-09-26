export interface LeadSearchFilters {
  minRating?: number;
  minReviewCount?: number;
  hasWebsite?: boolean;
  noWebsiteOnly?: boolean;
}

/** Shared between the enqueue server action (producer) and the worker
 * (consumer) so their expectations of the job payload never drift apart. */
export interface LeadSearchJobData {
  searchId: string;
  organizationId: string;
  keyword: string;
  location: string;
  filters: LeadSearchFilters;
}
