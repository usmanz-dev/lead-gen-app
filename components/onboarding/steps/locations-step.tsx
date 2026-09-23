"use client";

import { useState } from "react";
import { MapPin, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function LocationsStep({
  value,
  isSaving,
  onBack,
  onNext,
}: {
  value: string[];
  isSaving: boolean;
  onBack: () => void;
  onNext: (locations: string[]) => void;
}) {
  const [locations, setLocations] = useState<string[]>(value);
  const [input, setInput] = useState("");

  function addLocation() {
    const trimmed = input.trim();
    if (trimmed && !locations.includes(trimmed)) {
      setLocations((prev) => [...prev, trimmed]);
    }
    setInput("");
  }

  function removeLocation(location: string) {
    setLocations((prev) => prev.filter((l) => l !== location));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Where do you plan to search for leads?
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Add one or more cities, regions, or areas — you can search any of them
        later.
      </p>

      <div className="mt-6 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLocation();
            }
          }}
          placeholder="e.g. Karachi, Pakistan"
          aria-label="Add a location"
        />
        <Button type="button" variant="outline" onClick={addLocation}>
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      {locations.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {locations.map((location) => (
            <Badge
              key={location}
              variant="secondary"
              className="h-auto gap-1 py-1 pr-1"
            >
              <MapPin className="size-3" aria-hidden="true" />
              {location}
              <button
                type="button"
                onClick={() => removeLocation(location)}
                aria-label={`Remove ${location}`}
                className="hover:bg-foreground/10 rounded-full p-0.5"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 text-xs">
          Add at least one location to continue.
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={locations.length === 0}
          loading={isSaving}
          onClick={() => onNext(locations)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
