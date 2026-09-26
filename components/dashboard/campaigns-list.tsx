"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Send,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  Copy,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CampaignStatusBadge } from "@/components/dashboard/campaign-status-badge";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  updateCampaignStatus,
  duplicateCampaign,
  deleteCampaign,
} from "@/app/(dashboard)/dashboard/campaigns/actions";
import type { CampaignListItem } from "@/lib/campaigns";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CampaignsList({
  initialCampaigns,
}: {
  initialCampaigns: CampaignListItem[];
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignListItem | null>(
    null
  );
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleToggleStatus(campaign: CampaignListItem) {
    const nextStatus = campaign.status === "sending" ? "paused" : "sending";
    setBusyId(campaign.id);
    try {
      await updateCampaignStatus(campaign.id, nextStatus);
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaign.id ? { ...c, status: nextStatus } : c
        )
      );
    } catch (err) {
      setNotice({
        type: "error",
        message:
          err instanceof Error ? err.message : "Couldn't update campaign.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(campaign: CampaignListItem) {
    setBusyId(campaign.id);
    try {
      const { id } = await duplicateCampaign(campaign.id);
      setNotice({
        type: "success",
        message: `Duplicated as "${campaign.name} (Copy)".`,
      });
      router.push(`/dashboard/campaigns/${id}`);
    } catch (err) {
      setNotice({
        type: "error",
        message:
          err instanceof Error ? err.message : "Couldn't duplicate campaign.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteCampaign(deleteTarget.id);
      setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setNotice({
        type: "error",
        message:
          err instanceof Error ? err.message : "Couldn't delete campaign.",
      });
    } finally {
      setBusyId(null);
    }
  }

  function RowActions({ campaign }: { campaign: CampaignListItem }) {
    const canToggle =
      campaign.status === "sending" || campaign.status === "paused";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
          <span className="sr-only">Actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
          >
            <Eye className="size-4" aria-hidden="true" />
            View
          </DropdownMenuItem>
          {canToggle && (
            <DropdownMenuItem onClick={() => handleToggleStatus(campaign)}>
              {campaign.status === "sending" ? (
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
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => handleDuplicate(campaign)}>
            <Copy className="size-4" aria-hidden="true" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteTarget(campaign)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button render={<Link href="/dashboard/campaigns/new" />}>
          <Plus className="size-4" aria-hidden="true" />
          New Campaign
        </Button>
      </div>

      {notice && (
        <p
          className={
            notice.type === "success"
              ? "text-success text-sm"
              : "text-destructive text-sm"
          }
          role="status"
        >
          {notice.message}
        </p>
      )}

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <Send
              className="text-muted-foreground mb-3 size-8"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold">No campaigns yet</h2>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              Create a campaign, then add leads to it from the Leads page.
            </p>
            <Button
              className="mt-6"
              render={<Link href="/dashboard/campaigns/new" />}
            >
              New Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Replied</TableHead>
                  <TableHead>Bounced</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow
                    key={campaign.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/campaigns/${campaign.id}`)
                    }
                  >
                    <TableCell className="max-w-56 truncate font-medium">
                      {campaign.name}
                    </TableCell>
                    <TableCell>
                      <CampaignStatusBadge status={campaign.status} />
                    </TableCell>
                    <TableCell>{campaign.leadCount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.sentCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.openedCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.repliedCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.bouncedCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(campaign.createdAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActions campaign={campaign} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-3 sm:hidden">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/campaigns/${campaign.id}`)
                }
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-muted-foreground text-xs">
                        Created {formatDate(campaign.createdAt)}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CampaignStatusBadge status={campaign.status} />
                      <RowActions campaign={campaign} />
                    </div>
                  </div>
                  <div className="text-muted-foreground grid grid-cols-3 gap-2 text-sm">
                    <span>{campaign.leadCount.toLocaleString()} leads</span>
                    <span>{campaign.sentCount.toLocaleString()} sent</span>
                    <span>{campaign.openedCount.toLocaleString()} opened</span>
                    <span>
                      {campaign.repliedCount.toLocaleString()} replied
                    </span>
                    <span>
                      {campaign.bouncedCount.toLocaleString()} bounced
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        description="This permanently removes the campaign and its lead assignments. This can't be undone."
        confirmLabel="Delete"
        isBusy={busyId === deleteTarget?.id}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
