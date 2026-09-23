"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { getLoginErrorInfo } from "@/lib/auth-errors";
import { forgetSessionOnBrowserClose } from "@/lib/remember-me";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [formError, setFormError] = useState<{
    message: string;
    suggestResendConfirmation?: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  async function onSubmit(values: LoginValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError(null);
    setResendDone(false);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setFormError(getLoginErrorInfo(error));
        return;
      }

      if (!values.rememberMe) {
        forgetSessionOnBrowserClose();
      }

      const { data: membership } = await supabase
        .from("team_members")
        .select("organization_id")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      let onboardingCompleted = false;
      if (membership?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("onboarding_completed")
          .eq("id", membership.organization_id)
          .maybeSingle();
        onboardingCompleted = org?.onboarding_completed ?? false;
      }

      router.push(
        onboardingCompleted
          ? (searchParams.get("redirect") ?? "/dashboard")
          : "/onboarding"
      );
      router.refresh();
    } catch (error) {
      setFormError(
        getLoginErrorInfo(
          error instanceof Error ? error : new Error(String(error))
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error) {
        setFormError(getLoginErrorInfo(error));
        setIsGoogleLoading(false);
      }
    } catch (error) {
      setFormError(
        getLoginErrorInfo(
          error instanceof Error ? error : new Error(String(error))
        )
      );
      setIsGoogleLoading(false);
    }
  }

  async function onResendConfirmation() {
    setIsResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: getValues("email"),
      });
      if (!error) setResendDone(true);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onGoogleLogin}
        loading={isGoogleLoading}
        disabled={isSubmitting}
      >
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">
            Or continue with email
          </span>
        </div>
      </div>

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

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
          <Link
            href="/forgot-password"
            className="text-primary block text-sm hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label
                htmlFor="rememberMe"
                className="text-muted-foreground text-sm font-normal"
              >
                Remember me
              </Label>
            </div>
          )}
        />

        {formError && (
          <p className="text-destructive text-sm" role="alert">
            {formError.message}
            {formError.suggestResendConfirmation && (
              <>
                {" "}
                {resendDone ? (
                  <span className="text-success">Confirmation email sent.</span>
                ) : (
                  <button
                    type="button"
                    onClick={onResendConfirmation}
                    disabled={isResending}
                    className="font-medium hover:underline disabled:opacity-50"
                  >
                    {isResending ? "Sending…" : "Resend confirmation email"}
                  </button>
                )}
              </>
            )}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          disabled={isGoogleLoading}
        >
          Log In
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
