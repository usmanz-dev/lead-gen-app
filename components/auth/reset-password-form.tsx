"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";
import { getResetPasswordErrorInfo } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { CircleCheck, Eye, EyeOff } from "lucide-react";

const REDIRECT_DELAY_MS = 3000;

export function ResetPasswordForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<{
    message: string;
    linkExpired?: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");

  // Sign out of the transient recovery session and hand the user back to
  // a normal login — they confirm the new password works instead of
  // silently landing on the dashboard with a lingering recovery session.
  useEffect(() => {
    if (!isSuccess) return;
    const supabase = createClient();
    const timer = setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/login");
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  async function onSubmit(values: ResetPasswordValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        setFormError(getResetPasswordErrorInfo(error));
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      setFormError(
        getResetPasswordErrorInfo(
          error instanceof Error ? error : new Error(String(error))
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-success/10 text-success mx-auto flex size-11 items-center justify-center rounded-full">
          <CircleCheck className="size-5" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold">Password updated</h2>
        <p className="text-muted-foreground text-sm">
          Redirecting you to log in with your new password…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="pr-9"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-9 items-center justify-center transition-colors duration-150 ease-in-out"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-destructive text-sm">
            {errors.password.message}
          </p>
        )}
        <PasswordStrengthMeter password={password ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            className="pr-9"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-9 items-center justify-center transition-colors duration-150 ease-in-out"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showConfirmPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-destructive text-sm">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {formError && (
        <p className="text-destructive text-sm" role="alert">
          {formError.message}
          {formError.linkExpired && (
            <>
              {" "}
              <Link
                href="/forgot-password"
                className="font-medium hover:underline"
              >
                Request a new link
              </Link>
            </>
          )}
        </p>
      )}

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Update Password
      </Button>
    </form>
  );
}
