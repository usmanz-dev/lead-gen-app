"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Server, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WarmupProgressBar } from "@/components/dashboard/senders/warmup-progress-bar";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  toggleSenderActive,
  toggleSenderWarmup,
  getSenderUsage,
  removeSender,
  getSenderDetail,
  type SenderDetail,
} from "@/app/(dashboard)/dashboard/settings/senders/actions";

export function SenderDetailView({
  initialSender,
}: {
  initialSender: SenderDetail;
}) {
  const router = useRouter();
  const [sender, setSender] = useState(initialSender);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function refresh() {
    const fresh = await getSenderDetail(sender.id);
    if (fresh) setSender(fresh);
  }

  async function handleToggleActive(isActive: boolean) {
    setIsBusy(true);
    setError(null);
    try {
      await toggleSenderActive(sender.id, isActive);
      setSender((prev) => ({ ...prev, isActive }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update sender.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleToggleWarmup(warmupEnabled: boolean) {
    setIsBusy(true);
    setError(null);
    try {
      await toggleSenderWarmup(sender.id, warmupEnabled);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update warm-up.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRemoveClick() {
    setDeleteOpen(true);
    setDeleteWarning(null);
    try {
      const usage = await getSenderUsage(sender.id);
      if (usage.activeCampaigns.length > 0) {
        setDeleteWarning(
          `In use by ${usage.activeCampaigns.length} active campaign${usage.activeCampaigns.length === 1 ? "" : "s"}: ${usage.activeCampaigns.map((c) => c.name).join(", ")}. Removing this sender will leave ${usage.activeCampaigns.length === 1 ? "it" : "them"} without a sender.`
        );
      }
    } catch {
      // Non-critical.
    }
  }

  async function handleConfirmRemove() {
    setIsDeleting(true);
    try {
      await removeSender(sender.id);
      router.push("/dashboard/settings/senders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove sender.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/settings/senders"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Sender Settings
      </Link>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
            {sender.provider === "gmail" ? (
              <Mail className="size-5" aria-hidden="true" />
            ) : (
              <Server className="size-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {sender.emailAddress}
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {sender.provider === "gmail"
                ? "Gmail / Workspace"
                : "Custom SMTP"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-destructive"
          onClick={handleRemoveClick}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Remove Sender
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Status</CardTitle>
            <Badge variant={sender.isActive ? "success" : "secondary"}>
              {sender.isActive ? "Active" : "Disabled"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active-toggle">Enabled</Label>
                <p className="text-muted-foreground text-xs">
                  Disabled senders are skipped by campaigns and new sends.
                </p>
              </div>
              <Switch
                id="active-toggle"
                checked={sender.isActive}
                disabled={isBusy}
                onCheckedChange={handleToggleActive}
              />
            </div>
            <div className="border-t pt-4">
              <p className="text-muted-foreground text-xs">Sent today</p>
              <p className="text-lg font-semibold">
                {sender.sentToday} / {sender.dailySendLimit}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Warm-up</CardTitle>
            <Switch
              checked={sender.warmup.phase !== "disabled"}
              disabled={isBusy}
              onCheckedChange={handleToggleWarmup}
              aria-label="Toggle warm-up"
            />
          </CardHeader>
          <CardContent>
            <WarmupProgressBar warmup={sender.warmup} />
            <p className="text-muted-foreground mt-3 text-xs">
              Gradually raises this sender&apos;s daily limit from a low
              starting volume up to {sender.warmup.targetDailyLimit}/day over
              the first {sender.warmup.totalDays} days — new mailboxes that send
              at full volume immediately get flagged as spam far more often.
            </p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Remove ${sender.emailAddress}?`}
        description={
          deleteWarning ?? "This disconnects the sender. This can't be undone."
        }
        confirmLabel="Remove"
        isBusy={isDeleting}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
