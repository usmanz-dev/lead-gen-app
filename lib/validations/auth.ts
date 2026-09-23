import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

export type LoginValues = z.infer<typeof loginSchema>;

/** Single source of truth for "new password" rules — reused by signup and reset-password. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Include at least one number");

export const signupSchema = z.object({
  fullName: z.string().min(1, "Your name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: passwordSchema,
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms of Service to continue",
  }),
});

export type SignupValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
