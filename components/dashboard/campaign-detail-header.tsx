"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pause, Play, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignStatusBadge } from "@/components/dashboard/campaign-status-badge";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  updateCampaignStatus,
  duplicateCampaign,
  deleteCampaign,
} from "@/app/(dashboard)/dashboard/campaigns/actions";
import type { CampaignHeader } from "@/lib/campaigns";

export function CampaignDetailHeader({
  campaign,
}: {
  campaign: CampaignHeader;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(campaign.status);
  const [isBusy, setIsBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canToggle = status === "sending" || status === "paused";

  async function handleToggleStatus() {
    const nextStatus = status === "sending" ? "paused" : "sending";
    setIsBusy(true);
    try {
      await updateCampaignStatus(campaign.id, nextStatus);
      setStatus(nextStatus);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't update campaign."
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDuplicate() {
    setIsBusy(true);
    try {
      const { id } = await duplicateCampaign(campaign.id);
      router.push(`/dashboard/campaigns/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't duplicate campaign."
      );
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    setIsBusy(true);
    try {
      await deleteCampaign(campaign.id);
      router.push("/dashboard/campaigns");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't delete campaign."
      );
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/campaigns"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Campaigns
      </Link>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {campaign.name}
            </h1>
            <CampaignStatusBadge status={status} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Created {new Date(campaign.createdAt).toLocaleDateString()}
            {campaign.senderEmail && ` · Sending from ${campaign.senderEmail}`}
            {campaign.scheduledAt &&
              ` · Scheduled for ${new Date(campaign.scheduledAt).toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canToggle && (
            <Button
              variant="outline"
              loading={isBusy}
              onClick={handleToggleStatus}
            >
              {status === "sending" ? (
                <>
                  <Pause className="size-4" aria-hidden="true" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-4" aria-hidden="true" />
                  Resume
                </>
              )}
            </Button>
          )}
          <Button variant="outline" disabled={isBusy} onClick={handleDuplicate}>
            <Copy className="size-4" aria-hidden="true" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            className="text-destructive"
            disabled={isBusy}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${campaign.name}"?`}
        description="This permanently removes the campaign and its lead assignments. This can't be undone."
        confirmLabel="Delete"
        isBusy={isBusy}
        onConfirm={handleDelete}
      />
    </div>
  );
}
