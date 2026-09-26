"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  createCampaign,
  listSenderAccounts,
  type SenderAccountOption,
} from "@/app/(dashboard)/dashboard/campaigns/actions";

const NO_SENDER_VALUE = "__none__";

export function CampaignBuilderForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [senderAccounts, setSenderAccounts] = useState<SenderAccountOption[]>(
    []
  );
  const [senderAccountId, setSenderAccountId] = useState(NO_SENDER_VALUE);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSenderAccounts()
      .then(setSenderAccounts)
      .catch(() => undefined);
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Give the campaign a name.");
      return;
    }
    if (isScheduled && !scheduledAt) {
      setError("Choose when to send this campaign.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { id } = await createCampaign({
        name,
        senderAccountId:
          senderAccountId === NO_SENDER_VALUE ? undefined : senderAccountId,
        scheduledAt: isScheduled
          ? new Date(scheduledAt).toISOString()
          : undefined,
      });
      router.push(`/dashboard/campaigns/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create campaign."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name">Campaign name</Label>
          <Input
            id="campaign-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dentists — Karachi outreach"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sender-account">Sending from</Label>
          <Select
            value={senderAccountId}
            onValueChange={(v: string | null) => v && setSenderAccountId(v)}
          >
            <SelectTrigger id="sender-account" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SENDER_VALUE}>Choose later</SelectItem>
              {senderAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.emailAddress}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {senderAccounts.length === 0 && (
            <p className="text-muted-foreground text-xs">
              No sender email connected yet — you can pick one later.
            </p>
          )}
        </div>

        <div className="border-border flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="schedule-toggle">Schedule for later</Label>
            <p className="text-muted-foreground text-xs">
              Off saves this as a draft you can start manually.
            </p>
          </div>
          <Switch
            id="schedule-toggle"
            checked={isScheduled}
            onCheckedChange={setIsScheduled}
          />
        </div>

        {isScheduled && (
          <div className="space-y-1.5">
            <Label htmlFor="scheduled-at">Send at</Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}

        <Button
          className="w-full"
          loading={isSubmitting}
          onClick={handleSubmit}
        >
          Create Campaign
        </Button>
      </CardContent>
    </Card>
  );
}
