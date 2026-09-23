"use client";

import { useState } from "react";
import {
  User,
  Building2,
  Users,
  Ellipsis,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BusinessType } from "@/lib/types/database.types";

const OPTIONS: Array<{
  value: BusinessType;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "freelancer",
    label: "Freelancer",
    description: "It's just me",
    icon: User,
  },
  {
    value: "agency",
    label: "Agency",
    description: "We serve multiple clients",
    icon: Building2,
  },
  {
    value: "in_house_team",
    label: "In-house Team",
    description: "We market our own business",
    icon: Users,
  },
  {
    value: "other",
    label: "Other",
    description: "None of the above",
    icon: Ellipsis,
  },
];

export function BusinessTypeStep({
  value,
  isSaving,
  onNext,
}: {
  value: BusinessType | null;
  isSaving: boolean;
  onNext: (value: BusinessType) => void;
}) {
  const [selected, setSelected] = useState<BusinessType | null>(value);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        What&apos;s your business type?
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        This helps us tailor the dashboard to how you work.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONS.map(
          ({ value: optionValue, label, description, icon: Icon }) => {
            const isSelected = selected === optionValue;
            return (
              <button
                key={optionValue}
                type="button"
                onClick={() => setSelected(optionValue)}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-[transform,box-shadow,border-color] duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                    : "border-border bg-card"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-muted-foreground text-xs">
                    {description}
                  </div>
                </div>
              </button>
            );
          }
        )}
      </div>

      <Button
        type="button"
        className="mt-8 w-full"
        disabled={!selected}
        loading={isSaving}
        onClick={() => selected && onNext(selected)}
      >
        Next
      </Button>
    </div>
  );
}
