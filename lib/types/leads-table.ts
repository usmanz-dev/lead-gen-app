import type {
  EmailValidationStatus,
  LeadStatus,
} from "@/lib/types/database.types";

/** Matches app/api/leads/route.ts's LIST_COLUMNS — kept lean so paginated
 * fetches stay fast; the detail drawer fetches the richer row separately. */
export interface LeadListRow {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  website_url: string | null;
  rating: number | null;
  review_count: number;
  email: string | null;
  email_validation_status: EmailValidationStatus;
  opportunity_score: number | null;
  status: LeadStatus;
  search_id: string | null;
  created_at: string;
}

/** Matches app/api/leads/[id]/route.ts. */
export interface LeadDetailRow extends LeadListRow {
  address: string | null;
  google_maps_url: string | null;
  social_links: Partial<
    Record<"facebook" | "instagram" | "linkedin" | "x", string>
  >;
  opportunity_score_breakdown: Record<string, number | undefined>;
  notes: string | null;
}
