import { Search, TrendingUp } from "lucide-react";

const MOCK_LEADS = [
  {
    name: "Riverside Dental Care",
    category: "Dentist",
    score: 82,
    band: "high",
  },
  {
    name: "Sunset Auto Repair",
    category: "Auto Repair",
    score: 67,
    band: "medium",
  },
  {
    name: "Greenleaf Law Group",
    category: "Law Firm",
    score: 91,
    band: "high",
  },
  { name: "Coastal Fitness Studio", category: "Gym", score: 34, band: "low" },
] as const;

const BAND_STYLES = {
  high: "bg-success/10 text-success",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
} as const;

/**
 * An abstract, self-contained visualization of the product (no external
 * screenshot asset) — a browser-chrome frame around a simplified leads
 * table, styled entirely from the app's own design tokens.
 */
export function HeroMockup() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="bg-primary/20 absolute -inset-8 -z-10 rounded-[3rem] blur-3xl"
      />
      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-border bg-secondary/60 flex items-center gap-1.5 border-b px-4 py-3">
          <span className="bg-destructive/40 size-2.5 rounded-full" />
          <span className="bg-primary/30 size-2.5 rounded-full" />
          <span className="bg-success/40 size-2.5 rounded-full" />
          <div className="bg-background text-muted-foreground ml-3 flex flex-1 items-center gap-2 rounded-md px-3 py-1 text-xs">
            <Search className="size-3" aria-hidden="true" />
            dentists in Karachi
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">24 leads found</span>
            <span className="text-success flex items-center gap-1 text-xs font-medium">
              <TrendingUp className="size-3" aria-hidden="true" />
              Sorted by Opportunity Score
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {MOCK_LEADS.map((lead) => (
              <div
                key={lead.name}
                className="border-border/60 flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="text-sm font-medium">{lead.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {lead.category}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BAND_STYLES[lead.band]}`}
                >
                  {lead.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
