"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRESET_INDUSTRIES = [
  "Dentists",
  "Restaurants",
  "Law Firms",
  "Real Estate",
  "Home Services",
  "Auto Repair",
  "Salons & Spas",
  "Fitness & Gyms",
  "Retail Stores",
  "Medical Practices",
  "Accounting Firms",
  "Contractors",
];

export function IndustriesStep({
  value,
  isSaving,
  onBack,
  onNext,
}: {
  value: string[];
  isSaving: boolean;
  onBack: () => void;
  onNext: (industries: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(value);
  const [customInput, setCustomInput] = useState("");

  const customSelected = selected.filter(
    (industry) => !PRESET_INDUSTRIES.includes(industry)
  );

  function toggle(industry: string) {
    setSelected((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed]);
    }
    setCustomInput("");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Which industries do you target?
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Select any that apply, or add your own. You can change these later.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PRESET_INDUSTRIES.map((industry) => {
          const isSelected = selected.includes(industry);
          return (
            <button
              key={industry}
              type="button"
              onClick={() => toggle(industry)}
              aria-pressed={isSelected}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-in-out",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              )}
            >
              {industry}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add your own industry…"
          aria-label="Add a custom industry"
        />
        <Button type="button" variant="outline" onClick={addCustom}>
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      {customSelected.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {customSelected.map((industry) => (
            <Badge
              key={industry}
              variant="secondary"
              className="h-auto gap-1 py-1 pr-1"
            >
              {industry}
              <button
                type="button"
                onClick={() => toggle(industry)}
                aria-label={`Remove ${industry}`}
                className="hover:bg-foreground/10 rounded-full p-0.5"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-muted-foreground mt-3 text-xs">
          Pick at least one industry to continue.
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={selected.length === 0}
          loading={isSaving}
          onClick={() => onNext(selected)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
