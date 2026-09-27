"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  getRecipientPreview,
  sendTestEmail,
  launchCampaign,
  type RecipientPreview,
  type WizardLeadSummary,
} from "@/app/(dashboard)/dashboard/campaigns/actions";

export function StepReviewSchedule({
  campaignName,
  leadIds,
  sampleLead,
  subject,
  body,
  senderAccountId,
  senderEmail,
  includeUnvalidatedEmails,
  onIncludeUnvalidatedChange,
  onBack,
}: {
  campaignName: string;
  leadIds: string[];
  sampleLead: WizardLeadSummary | null;
  subject: string;
  body: string;
  senderAccountId: string;
  senderEmail: string;
  includeUnvalidatedEmails: boolean;
  onIncludeUnvalidatedChange: (value: boolean) => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<RecipientPreview | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecipientPreview(leadIds, includeUnvalidatedEmails).then(setPreview);
  }, [leadIds, includeUnvalidatedEmails]);

  async function handleSendTest() {
    setIsSendingTest(true);
    setError(null);
    setTestSent(false);
    try {
      await sendTestEmail({
        senderAccountId,
        subject,
        body,
        sampleLead: {
          businessName: sampleLead?.name ?? "Acme Dental",
          category: sampleLead?.category ?? null,
          opportunityScoreBreakdown:
            sampleLead?.opportunityScoreBreakdown ?? {},
        },
      });
      setTestSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't send the test email."
      );
    } finally {
      setIsSendingTest(false);
    }
  }

  async function handleLaunch() {
    setError(null);
    if (isScheduled && !scheduledAt) {
      setError("Choose when to send this campaign.");
      return;
    }
    setIsLaunching(true);
    try {
      const result = await launchCampaign({
        campaignName,
        leadIds,
        emailSubject: subject,
        emailBody: body,
        senderAccountId,
        includeUnvalidatedEmails,
        scheduledAt: isScheduled
          ? new Date(scheduledAt).toISOString()
          : undefined,
      });
      router.push(`/dashboard/campaigns/${result.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't launch campaign."
      );
      setIsLaunching(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Review &amp; Schedule
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Double-check everything, then launch.
      </p>

      <div className="mt-6 space-y-4">
        <Card>
          <CardContent className="grid grid-cols-1 gap-3 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs">Campaign</p>
              <p className="font-medium">
                {campaignName || "Untitled campaign"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Sending from</p>
              <p className="font-medium">{senderEmail}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Subject</p>
              <p className="font-medium">{subject}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Selected leads</p>
              <p className="font-medium">{leadIds.length.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="include-unvalidated">
                  Include unvalidated/invalid emails
                </Label>
                <p className="text-muted-foreground text-xs">
                  Off by default — skips leads with no email, an invalid
                  address, or one that&apos;s never been validated.
                </p>
              </div>
              <Switch
                id="include-unvalidated"
                checked={includeUnvalidatedEmails}
                onCheckedChange={onIncludeUnvalidatedChange}
              />
            </div>

            {preview && (
              <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-success text-lg font-semibold">
                    {preview.eligibleCount}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Will be emailed
                  </p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {preview.skippedNoEmail}
                  </p>
                  <p className="text-muted-foreground text-xs">No email</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {preview.skippedUnvalidated}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Unvalidated/invalid
                  </p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {preview.skippedUnsubscribed}
                  </p>
                  <p className="text-muted-foreground text-xs">Unsubscribed</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            loading={isSendingTest}
            onClick={handleSendTest}
          >
            <Send className="size-4" aria-hidden="true" />
            Send test email to myself
          </Button>
          {testSent && (
            <span className="text-success text-sm">Test email sent.</span>
          )}
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="schedule-toggle">Schedule for later</Label>
              <Switch
                id="schedule-toggle"
                checked={isScheduled}
                onCheckedChange={setIsScheduled}
              />
            </div>
            {isScheduled && (
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            )}
          </CardContent>
        </Card>

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          loading={isLaunching}
          disabled={!preview || preview.eligibleCount === 0}
          onClick={handleLaunch}
        >
          <Rocket className="size-4" aria-hidden="true" />
          {isScheduled ? "Schedule Campaign" : "Launch Campaign"}
        </Button>
      </div>
    </div>
  );
}
