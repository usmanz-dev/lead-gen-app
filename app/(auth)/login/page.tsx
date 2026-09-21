import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Log in to your LocalLeads AI account
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
