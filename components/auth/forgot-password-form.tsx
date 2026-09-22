"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      if (error) {
        setFormError(error.message);
        return;
      }

      setSentTo(values.email);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Please check your setup and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-success/10 text-success mx-auto flex size-11 items-center justify-center rounded-full">
          <MailCheck className="size-5" aria-hidden="true" />
        </div>
        <p className="text-muted-foreground text-sm">
          If an account exists for <strong>{sentTo}</strong>, we&apos;ve sent a
          password reset link to it.
        </p>
        <Link href="/login" className="text-primary text-sm hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        )}
      </div>

      {formError && <p className="text-destructive text-sm">{formError}</p>}

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Send reset link
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
