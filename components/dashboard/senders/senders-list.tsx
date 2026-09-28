"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Mail, Server, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConnectSenderModal } from "@/components/dashboard/senders/connect-sender-modal";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  toggleSenderActive,
  removeSender,
  getSenderUsage,
  type SenderDetail,
} from "@/app/(dashboard)/dashboard/settings/senders/actions";

export function SendersList({
  organizationId,
  initialSenders,
}: {
  organizationId: string;
  initialSenders: SenderDetail[];
}) {
  const searchParams = useSearchParams();
  const [senders, setSenders] = useState(initialSenders);
  const [connectOpen, setConnectOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SenderDetail | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected)
      return { type: "success", message: `Connected ${connected}.` };
    if (error) return { type: "error", message: error };
    return null;
  });

  async function handleToggleActive(sender: SenderDetail, isActive: boolean) {
    setBusyId(sender.id);
    try {
      await toggleSenderActive(sender.id, isActive);
      setSenders((prev) =>
        prev.map((s) => (s.id === sender.id ? { ...s, isActive } : s))
      );
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't update sender.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveClick(sender: SenderDetail) {
    setDeleteTarget(sender);
    setDeleteWarning(null);
    try {
      const usage = await getSenderUsage(sender.id);
      if (usage.activeCampaigns.length > 0) {
        setDeleteWarning(
          `In use by ${usage.activeCampaigns.length} active campaign${usage.activeCampaigns.length === 1 ? "" : "s"}: ${usage.activeCampaigns.map((c) => c.name).join(", ")}. Removing this sender will leave ${usage.activeCampaigns.length === 1 ? "it" : "them"} without a sender.`
        );
      }
    } catch {
      // Non-critical — the confirm dialog still works without the warning.
    }
  }

  async function handleConfirmRemove() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await removeSender(deleteTarget.id);
      setSenders((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't remove sender.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setConnectOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Connect New Sender
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

      {senders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <Mail
              className="text-muted-foreground mb-3 size-8"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold">No senders connected</h2>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              Connect a Gmail/Workspace account or a custom SMTP mailbox to send
              campaigns.
            </p>
            <Button className="mt-6" onClick={() => setConnectOpen(true)}>
              Connect New Sender
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {senders.map((sender) => (
            <Card key={sender.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <Link
                  href={`/dashboard/settings/senders/${sender.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                    {sender.provider === "gmail" ? (
                      <Mail className="size-4" aria-hidden="true" />
                    ) : (
                      <Server className="size-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {sender.emailAddress}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {sender.provider === "gmail"
                        ? "Gmail / Workspace"
                        : "Custom SMTP"}{" "}
                      · {sender.sentToday}/{sender.dailySendLimit} sent today
                      {sender.warmup.phase === "warming_up" &&
                        ` · Warming up (day ${sender.warmup.dayNumber}/${sender.warmup.totalDays})`}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <Badge variant={sender.isActive ? "success" : "secondary"}>
                    {sender.isActive ? "Active" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={sender.isActive}
                    disabled={busyId === sender.id}
                    onCheckedChange={(checked: boolean) =>
                      handleToggleActive(sender, checked)
                    }
                    aria-label={`${sender.isActive ? "Disable" : "Enable"} ${sender.emailAddress}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => handleRemoveClick(sender)}
                    aria-label={`Remove ${sender.emailAddress}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConnectSenderModal
        organizationId={organizationId}
        open={connectOpen}
        onOpenChange={setConnectOpen}
        onConnected={(account) => {
          const now = new Date().toISOString();
          setSenders((prev) => [
            {
              id: account.id,
              emailAddress: account.emailAddress,
              provider: "smtp",
              isActive: true,
              dailySendLimit: 50,
              sentToday: 0,
              warmup: {
                phase: "warming_up",
                dayNumber: 1,
                totalDays: 14,
                currentDailyLimit: 5,
                targetDailyLimit: 50,
                percent: 7,
              },
              createdAt: now,
            },
            ...prev,
          ]);
          setNotice({
            type: "success",
            message: `Connected ${account.emailAddress}.`,
          });
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.emailAddress ?? ""}?`}
        description={
          deleteWarning ?? "This disconnects the sender. This can't be undone."
        }
        confirmLabel="Remove"
        isBusy={busyId === deleteTarget?.id}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
