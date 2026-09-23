import Link from "next/link";
import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

// The validity of the recovery session can only be known per-request.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto flex size-11 items-center justify-center rounded-full">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold">Link invalid or expired</h1>
        <p className="text-muted-foreground text-sm">
          This password reset link is no longer valid. Request a new one to
          continue.
        </p>
        <Link
          href="/forgot-password"
          className="text-primary text-sm hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <p className="text-muted-foreground text-sm">
          Choose a new password for your account
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
