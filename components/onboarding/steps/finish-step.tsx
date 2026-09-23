"use client";

import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinishStep({
  firstName,
  isFinishing,
  onFinish,
}: {
  firstName: string;
  isFinishing: boolean;
  onFinish: () => void;
}) {
  return (
    <div className="text-center">
      <div className="bg-success/10 text-success mx-auto flex size-14 items-center justify-center rounded-full">
        <PartyPopper className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        You&apos;re all set!
      </h1>
      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
        Thanks, {firstName} — your organization is configured. Head to your
        dashboard to run your first lead search.
      </p>
      <Button
        type="button"
        className="mt-8 w-full"
        loading={isFinishing}
        onClick={onFinish}
      >
        Go to Dashboard
      </Button>
    </div>
  );
}
