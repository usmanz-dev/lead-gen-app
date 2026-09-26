import { z } from "zod";

export const leadSearchSchema = z
  .object({
    keyword: z
      .string()
      .min(1, "Enter what you're searching for")
      .max(100, "Keep it under 100 characters"),
    location: z
      .string()
      .min(1, "Enter a location")
      .max(200, "Keep it under 200 characters"),
    minRating: z.coerce.number().min(0).max(5).optional(),
    minReviewCount: z.coerce.number().int().min(0).optional(),
    hasWebsite: z.boolean(),
    noWebsiteOnly: z.boolean(),
  })
  .refine((data) => !(data.hasWebsite && data.noWebsiteOnly), {
    message: '"Has website" and "No website only" can\'t both be on',
    path: ["noWebsiteOnly"],
  });

export type LeadSearchFormInput = z.input<typeof leadSearchSchema>;
export type LeadSearchFormValues = z.output<typeof leadSearchSchema>;
