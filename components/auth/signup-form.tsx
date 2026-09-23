"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";
import { getSignupErrorInfo } from "@/lib/auth-errors";
import { isPlanId, isBillingInterval } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { Eye, EyeOff, MailCheck } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const intervalParam = searchParams.get("interval");
  // A plan selected on the pricing page carries through to Stripe Checkout
  // right after signup instead of the normal onboarding wizard.
  const postSignupPath = isPlanId(planParam)
    ? `/checkout?plan=${planParam}&interval=${isBillingInterval(intervalParam) ? intervalParam : "monthly"}`
    : "/onboarding";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null
  );
  const [formError, setFormError] = useState<{
    message: string;
    suggestLogin?: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      agreedToTerms: false,
    },
  });

  const password = watch("password");

  async function onSubmit(values: SignupValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postSignupPath)}`,
        },
      });

      if (error) {
        setFormError(getSignupErrorInfo(error));
        return;
      }

      // Supabase's documented signal for "this email is already registered":
      // signUp() succeeds without an error, but the returned user has no
      // identities attached (it never sends a duplicate-account error, to
      // avoid leaking which emails already have accounts).
      if (
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        setFormError({
          message: "This email is already registered.",
          suggestLogin: true,
        });
        return;
      }

      if (!data.session) {
        // Email confirmation is required by this project's Auth settings —
        // there's no authenticated session yet, so the organization can't
        // be created until the user confirms and logs in.
        setConfirmationEmail(values.email);
        return;
      }

      const orgName = `${values.fullName.split(" ")[0]}'s Organization`;
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName });

      if (orgError) {
        // The account exists; don't block the user over a secondary
        // failure — /onboarding creates the organization on demand if
        // it's still missing when they land there.
        console.error("Failed to create organization at signup:", orgError);
      }

      router.push(postSignupPath);
      router.refresh();
    } catch (error) {
      setFormError(
        getSignupErrorInfo(
          error instanceof Error ? error : new Error(String(error))
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onGoogleSignup() {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postSignupPath)}`,
        },
      });
      if (error) {
        setFormError(getSignupErrorInfo(error));
        setIsGoogleLoading(false);
      }
    } catch (error) {
      setFormError(
        getSignupErrorInfo(
          error instanceof Error ? error : new Error(String(error))
        )
      );
      setIsGoogleLoading(false);
    }
  }

  if (confirmationEmail) {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-success/10 text-success mx-auto flex size-11 items-center justify-center rounded-full">
          <MailCheck className="size-5" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold">Check your inbox</h2>
        <p className="text-muted-foreground text-sm">
          We sent a confirmation link to <strong>{confirmationEmail}</strong>.
          Click it to activate your account and finish setting up your
          organization.
        </p>
        <Link href="/login" className="text-primary text-sm hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onGoogleSignup}
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
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-destructive text-sm">
              {errors.fullName.message}
            </p>
          )}
        </div>

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

        <Controller
          name="agreedToTerms"
          control={control}
          render={({ field }) => (
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="agreedToTerms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-invalid={!!errors.agreedToTerms}
                  aria-describedby={
                    errors.agreedToTerms ? "terms-error" : undefined
                  }
                  className="mt-0.5"
                />
                <Label
                  htmlFor="agreedToTerms"
                  className="text-muted-foreground text-sm font-normal"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </Link>
                </Label>
              </div>
              {errors.agreedToTerms && (
                <p id="terms-error" className="text-destructive text-sm">
                  {errors.agreedToTerms.message}
                </p>
              )}
            </div>
          )}
        />

        {formError && (
          <p className="text-destructive text-sm" role="alert">
            {formError.message}
            {formError.suggestLogin && (
              <>
                {" "}
                <Link href="/login" className="font-medium hover:underline">
                  Log in instead
                </Link>
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
          Create Account
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
