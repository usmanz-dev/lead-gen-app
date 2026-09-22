"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { MailCheck } from "lucide-react";

export function SignupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupValues) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.add({
          type: "error",
          title: "Couldn't create account",
          description: error.message,
        });
        return;
      }

      // If email confirmation is disabled in the Supabase project,
      // signUp already returns an active session.
      if (data.session) {
        window.location.href = "/dashboard";
        return;
      }

      setConfirmationEmail(values.email);
    } catch (error) {
      toast.add({
        type: "error",
        title: "Something went wrong",
        description:
          error instanceof Error
            ? error.message
            : "Please check your setup and try again.",
      });
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
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast.add({
          type: "error",
          title: "Couldn't continue with Google",
          description: error.message,
        });
        setIsGoogleLoading(false);
      }
    } catch (error) {
      toast.add({
        type: "error",
        title: "Something went wrong",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
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
          Click it to activate your account.
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
      >
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
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
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-destructive text-sm">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
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

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
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
