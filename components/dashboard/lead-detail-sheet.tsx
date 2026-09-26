"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ScoreBadge,
  StatusPill,
  EmailCell,
  WebsiteCell,
} from "@/components/dashboard/lead-badges";
import { Send, Trash2, MapPin, Phone, Star } from "lucide-react";
import type { LeadDetailRow } from "@/lib/types/leads-table";

const BREAKDOWN_LABELS: Record<string, string> = {
  no_website: "No website",
  low_review_count: "Low review count",
  low_rating: "Low rating",
  missing_hours: "Missing business hours",
  no_social_presence: "No social media presence",
  poor_mobile_friendliness: "Poor mobile friendliness",
  no_ssl: "No SSL certificate",
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
};

export function LeadDetailSheet({
  leadId,
  onOpenChange,
  onAddToCampaign,
  onDelete,
}: {
  leadId: string | null;
  onOpenChange: (open: boolean) => void;
  onAddToCampaign: (leadId: string) => void;
  onDelete: (leadId: string) => void;
}) {
  const [lead, setLead] = useState<LeadDetailRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetch(`/api/leads/${leadId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Couldn't load this lead.");
        const data = (await res.json()) as { lead: LeadDetailRow };
        setLead(data.lead);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setIsLoading(false));
  }, [leadId]);

  const socialEntries = lead
    ? Object.entries(lead.social_links).filter(([, url]) => !!url)
    : [];
  const breakdownEntries = lead
    ? Object.entries(lead.opportunity_score_breakdown).filter(
        ([, points]) => points !== undefined
      )
    : [];

  return (
    <Sheet open={!!leadId} onOpenChange={onOpenChange}>
      <SheetContent>
        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && <p className="text-destructive p-4 text-sm">{error}</p>}

        {lead && !isLoading && (
          <>
            <SheetHeader>
              <SheetTitle>{lead.name}</SheetTitle>
              <SheetDescription>
                {lead.category ?? "Uncategorized"}
              </SheetDescription>
              <div className="mt-1 flex items-center gap-2">
                <StatusPill status={lead.status} />
                <ScoreBadge score={lead.opportunity_score} />
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 text-sm">
              <div className="space-y-2">
                {lead.address && (
                  <div className="text-muted-foreground flex items-start gap-2">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{lead.address}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Phone className="size-4 shrink-0" aria-hidden="true" />
                    <a
                      href={`tel:${lead.phone}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.rating !== null && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Star className="size-4 shrink-0" aria-hidden="true" />
                    <span>
                      {lead.rating.toFixed(1)} ·{" "}
                      {lead.review_count.toLocaleString()}{" "}
                      {lead.review_count === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Website
                </p>
                <WebsiteCell url={lead.website_url} />
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Email
                </p>
                <EmailCell
                  email={lead.email}
                  status={lead.email_validation_status}
                />
              </div>

              {socialEntries.length > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Social
                  </p>
                  <ul className="space-y-1">
                    {socialEntries.map(([key, url]) => (
                      <li key={key}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {SOCIAL_LABELS[key] ?? key}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {breakdownEntries.length > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Opportunity score breakdown
                  </p>
                  <ul className="space-y-1">
                    {breakdownEntries.map(([factor, points]) => (
                      <li
                        key={factor}
                        className="flex items-center justify-between"
                      >
                        <span>{BREAKDOWN_LABELS[factor] ?? factor}</span>
                        <span className="text-muted-foreground">+{points}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lead.google_maps_url && (
                <a
                  href={lead.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary block hover:underline"
                >
                  View on Google Maps
                </a>
              )}
            </div>

            <SheetFooter className="flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onAddToCampaign(lead.id)}
              >
                <Send className="size-4" aria-hidden="true" />
                Add to Campaign
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => onDelete(lead.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
