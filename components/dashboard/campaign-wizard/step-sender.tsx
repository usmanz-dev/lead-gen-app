"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConnectSenderModal } from "@/components/dashboard/senders/connect-sender-modal";
import {
  listSenderAccounts,
  type SenderAccountOption,
} from "@/app/(dashboard)/dashboard/campaigns/actions";

function estimateCompletion(
  recipientCount: number,
  dailyLimit: number,
  sentToday: number
): string {
  if (recipientCount === 0) return "—";
  const remainingToday = Math.max(0, dailyLimit - sentToday);
  if (recipientCount <= remainingToday) return "Today";
  const remainingAfterToday = recipientCount - remainingToday;
  const extraDays = Math.ceil(remainingAfterToday / dailyLimit);
  const totalDays = (remainingToday > 0 ? 1 : 0) + extraDays;
  return `About ${totalDays} day${totalDays === 1 ? "" : "s"}`;
}

export function StepSender({
  organizationId,
  recipientCount,
  senderAccountId,
  onSenderAccountChange,
  onBack,
  onNext,
}: {
  organizationId: string;
  recipientCount: number;
  senderAccountId: string | null;
  onSenderAccountChange: (account: {
    id: string;
    emailAddress: string;
  }) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [accounts, setAccounts] = useState<SenderAccountOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  function refresh() {
    setIsLoading(true);
    listSenderAccounts()
      .then(setAccounts)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = accounts.find((a) => a.id === senderAccountId) ?? null;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Sender</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Choose which connected mailbox this campaign sends from.
      </p>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">
            Loading sender accounts…
          </p>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center px-6 py-10 text-center">
              <p className="text-sm font-medium">
                No sender email connected yet
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Connect a mailbox to send this campaign.
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Connect Email
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Select
                value={senderAccountId ?? undefined}
                onValueChange={(v: string | null) => {
                  const account = accounts.find((a) => a.id === v);
                  if (account) onSenderAccountChange(account);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a sender account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.emailAddress}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Add
              </Button>
            </div>

            {selected && (
              <Card>
                <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Daily limit</p>
                    <p className="text-lg font-semibold">
                      {selected.dailySendLimit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Sent today</p>
                    <p className="text-lg font-semibold">
                      {selected.sentToday}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Recipients</p>
                    <p className="text-lg font-semibold">{recipientCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Est. completion
                    </p>
                    <p className="text-lg font-semibold">
                      {estimateCompletion(
                        recipientCount,
                        selected.dailySendLimit,
                        selected.sentToday
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button disabled={!senderAccountId} onClick={onNext}>
          Next: Review &amp; Schedule
        </Button>
      </div>

      <ConnectSenderModal
        organizationId={organizationId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnected={(account) => {
          refresh();
          onSenderAccountChange(account);
        }}
      />
    </div>
  );
}
