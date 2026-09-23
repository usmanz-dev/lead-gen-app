"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/lib/plans";

export function BillingToggle({
  value,
  onChange,
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="border-border bg-secondary/60 relative inline-flex rounded-full border p-1">
        {(["monthly", "annual"] as const).map((interval) => (
          <button
            key={interval}
            type="button"
            onClick={() => onChange(interval)}
            aria-pressed={value === interval}
            className={cn(
              "relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 ease-in-out",
              value === interval
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {interval === "monthly" ? "Monthly" : "Annual"}
          </button>
        ))}
      </div>
      <Badge variant="success">Save 20%</Badge>
    </div>
  );
}
