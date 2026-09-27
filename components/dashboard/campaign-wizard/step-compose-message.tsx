"use client";

import { useState } from "react";
import { Sparkles, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  generateEmailTemplate,
  type WizardLeadSummary,
} from "@/app/(dashboard)/dashboard/campaigns/actions";
import { renderTemplate, DEFAULT_PLAIN_TEMPLATE } from "@/lib/merge-template";

const TEXTAREA_CLASS =
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-3";

export function StepComposeMessage({
  sampleLead,
  offerDescription,
  subject,
  body,
  onOfferDescriptionChange,
  onSubjectChange,
  onBodyChange,
  onBack,
  onNext,
}: {
  sampleLead: WizardLeadSummary | null;
  offerDescription: string;
  subject: string;
  body: string;
  onOfferDescriptionChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setIsGenerating(true);
    try {
      const template = await generateEmailTemplate({ offerDescription });
      onSubjectChange(template.subject);
      onBodyChange(template.body);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't generate a template."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function usePlainTemplate() {
    onSubjectChange(DEFAULT_PLAIN_TEMPLATE.subject);
    onBodyChange(DEFAULT_PLAIN_TEMPLATE.body);
  }

  const mergeData = {
    businessName: sampleLead?.name ?? "Acme Dental",
    category: sampleLead?.category ?? "Dentist",
    opportunityScoreBreakdown: sampleLead?.opportunityScoreBreakdown ?? {
      no_website: 25,
    },
  };
  const previewSubject = renderTemplate(subject, mergeData);
  const previewBody = renderTemplate(body, mergeData);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Compose Message</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Describe your offer once — merge variables personalize it per lead.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="offer">
              Your service or offer, in plain language
            </Label>
            <textarea
              id="offer"
              value={offerDescription}
              onChange={(e) => onOfferDescriptionChange(e.target.value)}
              placeholder="e.g. I build fast, mobile-friendly websites for local service businesses…"
              rows={3}
              className={TEXTAREA_CLASS}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                loading={isGenerating}
                disabled={!offerDescription.trim()}
                onClick={handleGenerate}
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                Generate with AI
              </Button>
              <Button variant="outline" size="sm" onClick={usePlainTemplate}>
                <FileText className="size-3.5" aria-hidden="true" />
                Use a plain template instead
              </Button>
            </div>
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="e.g. Quick idea for {{business_name}}"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Body</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={10}
              className={TEXTAREA_CLASS}
            />
            <p className="text-muted-foreground text-xs">
              Merge tokens: {"{{business_name}}"}, {"{{category}}"},{" "}
              {"{{opportunity_reason}}"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>
            Live preview — sample lead: {sampleLead?.name ?? "example lead"}
          </Label>
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="text-muted-foreground text-xs">Subject</p>
                <p className="text-sm font-medium">{previewSubject || "—"}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-muted-foreground text-xs">Body</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {previewBody || "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button disabled={!subject.trim() || !body.trim()} onClick={onNext}>
          Next: Sender
        </Button>
      </div>
    </div>
  );
}
