"use client";

import { getPasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

const BAR_COLOR_BY_SCORE = [
  "bg-border",
  "bg-destructive",
  "bg-destructive",
  "bg-primary",
  "bg-success",
] as const;

const LABEL_COLOR_BY_SCORE = [
  "text-muted-foreground",
  "text-destructive",
  "text-destructive",
  "text-primary",
  "text-success",
] as const;

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((segment) => (
          <div
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-150 ease-in-out",
              segment < score ? BAR_COLOR_BY_SCORE[score] : "bg-border"
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs", LABEL_COLOR_BY_SCORE[score])}>
        Password strength: {label}
      </p>
    </div>
  );
}
