import { z } from "zod";

export const LEAD_SORT_COLUMNS = [
  "name",
  "rating",
  "review_count",
  "opportunity_score",
  "status",
  "created_at",
] as const;
export type LeadSortColumn = (typeof LEAD_SORT_COLUMNS)[number];

const LEAD_STATUS_VALUES = [
  "new",
  "contacted",
  "interested",
  "closed",
] as const;

/** Shared by the list route and the CSV export route — export applies the
 * same filters/sort but ignores pagination. */
export const leadsFilterSchema = z.object({
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((val) => (val ? val : undefined)),
  status: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .filter((s): s is (typeof LEAD_STATUS_VALUES)[number] =>
              (LEAD_STATUS_VALUES as readonly string[]).includes(s)
            )
        : []
    ),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  hasEmail: z.enum(["yes", "no"]).optional(),
  searchId: z.string().uuid().optional(),
  sortBy: z.enum(LEAD_SORT_COLUMNS).default("opportunity_score"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const leadsQuerySchema = leadsFilterSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});

export type LeadsFilterValues = z.output<typeof leadsFilterSchema>;
export type LeadsQueryValues = z.output<typeof leadsQuerySchema>;

/** Strips characters that would otherwise break PostgREST's comma-separated
 * `.or()` filter DSL or change the intent of an ILIKE pattern. A small
 * search-quality tradeoff (these characters are dropped from the query) in
 * exchange for never constructing a malformed or injectable filter string. */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()%_"]/g, "");
}
