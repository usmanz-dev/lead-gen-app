"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  leadSearchSchema,
  type LeadSearchFormInput,
  type LeadSearchFormValues,
} from "@/lib/validations/lead-search";
import { startLeadSearch } from "@/app/(dashboard)/dashboard/search/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  MapPin,
  Search,
  CircleCheck,
  CircleAlert,
  RotateCcw,
} from "lucide-react";

const POLL_INTERVAL_MS = 1500;
const RATING_OPTIONS = [
  { value: "any", label: "Any rating" },
  { value: "3", label: "3.0+ stars" },
  { value: "3.5", label: "3.5+ stars" },
  { value: "4", label: "4.0+ stars" },
  { value: "4.5", label: "4.5+ stars" },
];

interface LocationSuggestion {
  id: number;
  label: string;
}

interface SearchStatusPayload {
  id: string;
  keyword: string;
  location: string;
  status: "pending" | "running" | "completed" | "failed";
  leads_found: number;
  error_message: string | null;
}

type PhaseState =
  | { phase: "form" }
  | {
      phase: "polling";
      searchId: string;
      keyword: string;
      location: string;
      leadsFound: number;
    }
  | {
      phase: "completed";
      searchId: string;
      keyword: string;
      location: string;
      leadsFound: number;
    }
  | {
      phase: "failed";
      keyword: string;
      location: string;
      errorMessage: string;
    };

export function SearchForm() {
  const router = useRouter();
  const [state, setState] = useState<PhaseState>({ phase: "form" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadSearchFormInput, unknown, LeadSearchFormValues>({
    resolver: zodResolver(leadSearchSchema),
    defaultValues: {
      keyword: "",
      location: "",
      minRating: undefined,
      minReviewCount: undefined,
      hasWebsite: false,
      noWebsiteOnly: false,
    },
  });

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  function pollStatus(searchId: string, keyword: string, location: string) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/searches/${searchId}/status`);
        if (!response.ok) return;
        const data = (await response.json()) as { search: SearchStatusPayload };
        const search = data.search;

        if (search.status === "completed") {
          stopPolling();
          setState({
            phase: "completed",
            searchId,
            keyword,
            location,
            leadsFound: search.leads_found,
          });
          router.refresh();
        } else if (search.status === "failed") {
          stopPolling();
          setState({
            phase: "failed",
            keyword,
            location,
            errorMessage:
              search.error_message ??
              "The search failed unexpectedly. Please try again.",
          });
          router.refresh();
        } else {
          setState({
            phase: "polling",
            searchId,
            keyword,
            location,
            leadsFound: search.leads_found,
          });
        }
      } catch {
        // A transient network hiccup while polling isn't itself a search
        // failure — just skip this tick and try again on the next one.
      }
    }, POLL_INTERVAL_MS);
  }

  async function onSubmit(values: LeadSearchFormValues) {
    setSubmitError(null);
    try {
      const result = await startLeadSearch(values);
      setState({
        phase: "polling",
        searchId: result.searchId,
        keyword: values.keyword,
        location: values.location,
        leadsFound: 0,
      });
      pollStatus(result.searchId, values.keyword, values.location);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Couldn't start the search. Please try again."
      );
    }
  }

  function handleLocationChange(value: string) {
    setValue("location", value, { shouldValidate: true });
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/locations/autocomplete?q=${encodeURIComponent(value)}`
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          results: LocationSuggestion[];
        };
        setSuggestions(data.results);
        setShowSuggestions(data.results.length > 0);
      } catch {
        // Autocomplete is a convenience, not a requirement — a failed
        // lookup just means no suggestions this keystroke.
      }
    }, 300);
  }

  function selectSuggestion(suggestion: LocationSuggestion) {
    setValue("location", suggestion.label, { shouldValidate: true });
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function startOver() {
    setState({ phase: "form" });
    setSubmitError(null);
    reset();
  }

  function tryAgain() {
    setState({ phase: "form" });
  }

  if (state.phase === "polling") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <Loader2
            className="text-primary size-8 animate-spin"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-lg font-semibold">
            Searching for &ldquo;{state.keyword}&rdquo; in {state.location}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {state.leadsFound > 0
              ? `Found ${state.leadsFound.toLocaleString()} businesses so far...`
              : "Scanning Google Maps — this usually takes a minute or two."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state.phase === "completed") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="bg-success/10 text-success flex size-12 items-center justify-center rounded-full">
            <CircleCheck className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            {state.leadsFound.toLocaleString()}{" "}
            {state.leadsFound === 1 ? "lead" : "leads"} found
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            &ldquo;{state.keyword}&rdquo; in {state.location}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              render={
                <Link href={`/dashboard/leads?search=${state.searchId}`} />
              }
            >
              View Results
            </Button>
            <Button variant="outline" onClick={startOver}>
              Start another search
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.phase === "failed") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
            <CircleAlert className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            Search didn&apos;t complete
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            {state.errorMessage}
          </p>
          <Button className="mt-6" onClick={tryAgain}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="keyword">Keyword or niche</Label>
              <Input
                id="keyword"
                placeholder="e.g. dentists, plumbers, coffee shops"
                aria-invalid={!!errors.keyword}
                aria-describedby={errors.keyword ? "keyword-error" : undefined}
                {...register("keyword")}
              />
              {errors.keyword && (
                <p id="keyword-error" className="text-destructive text-sm">
                  {errors.keyword.message}
                </p>
              )}
            </div>

            <div className="relative space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  id="location"
                  placeholder="e.g. Austin, TX"
                  className="pl-8"
                  autoComplete="off"
                  aria-invalid={!!errors.location}
                  aria-describedby={
                    errors.location ? "location-error" : undefined
                  }
                  {...register("location", {
                    onChange: (e) => handleLocationChange(e.target.value),
                  })}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <ul className="border-border bg-popover absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border py-1 shadow-md">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                      <button
                        type="button"
                        className="hover:bg-accent hover:text-accent-foreground w-full px-3 py-2 text-left text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        {suggestion.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {errors.location && (
                <p id="location-error" className="text-destructive text-sm">
                  {errors.location.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="minRating">Minimum rating</Label>
              <Controller
                name="minRating"
                control={control}
                render={({ field }) => (
                  <Select
                    value={
                      field.value === undefined ? "any" : String(field.value)
                    }
                    onValueChange={(value: string | null) =>
                      field.onChange(
                        !value || value === "any" ? undefined : Number(value)
                      )
                    }
                  >
                    <SelectTrigger id="minRating" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minReviewCount">Minimum review count</Label>
              <Input
                id="minReviewCount"
                type="number"
                min={0}
                placeholder="e.g. 10"
                aria-invalid={!!errors.minReviewCount}
                {...register("minReviewCount")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="hasWebsite"
              control={control}
              render={({ field }) => (
                <div className="border-border flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="hasWebsite">Has a website</Label>
                    <p className="text-muted-foreground text-xs">
                      Only include businesses with a website
                    </p>
                  </div>
                  <Switch
                    id="hasWebsite"
                    checked={field.value}
                    onCheckedChange={(checked: boolean) => {
                      field.onChange(checked);
                      if (checked) setValue("noWebsiteOnly", false);
                    }}
                  />
                </div>
              )}
            />

            <Controller
              name="noWebsiteOnly"
              control={control}
              render={({ field }) => (
                <div className="border-border flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="noWebsiteOnly">No website only</Label>
                    <p className="text-muted-foreground text-xs">
                      Higher-opportunity leads with no site
                    </p>
                  </div>
                  <Switch
                    id="noWebsiteOnly"
                    checked={field.value}
                    onCheckedChange={(checked: boolean) => {
                      field.onChange(checked);
                      if (checked) setValue("hasWebsite", false);
                    }}
                  />
                </div>
              )}
            />
          </div>
          {errors.noWebsiteOnly && (
            <p className="text-destructive -mt-3 text-sm">
              {errors.noWebsiteOnly.message}
            </p>
          )}

          {submitError && (
            <p className="text-destructive text-sm" role="alert">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full sm:w-auto"
            loading={isSubmitting}
          >
            <Search className="size-4" aria-hidden="true" />
            Start Search
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
