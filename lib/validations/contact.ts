import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message is too long (2,000 characters max)"),
});

export type ContactValues = z.infer<typeof contactSchema>;
