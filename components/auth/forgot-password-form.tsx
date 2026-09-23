"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";
import { getForgotPasswordErrorInfo } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck } from "lucide-react";

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
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        {
          // Route through /auth/callback so the recovery link's code gets
          // exchanged for a session before the user reaches /reset-password
          // — updateUser() there needs that session to already exist.
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (error) {
        // Supabase never reports "this email isn't registered" here by
        // design — any error at this point is a genuine system failure,
        // not a signal about account existence, so it's safe to surface.
        setFormError(getForgotPasswordErrorInfo(error).message);
        return;
      }

      setSentTo(values.email);
    } catch (error) {
      setFormError(
        getForgotPasswordErrorInfo(
          error instanceof Error ? error : new Error(String(error))
        ).message
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
          password reset link to it. The link expires shortly, so use it soon.
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
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-destructive text-sm">
            {errors.email.message}
          </p>
        )}
      </div>

      {formError && (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Send Reset Link
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
