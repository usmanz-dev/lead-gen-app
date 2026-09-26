"use client";

import { useEffect, useRef, useState } from "react";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignLeadStatusPill } from "@/components/dashboard/campaign-lead-status-pill";
import type { CampaignLeadEmailStatus } from "@/lib/types/database.types";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "any", label: "Any status" },
  { value: "queued", label: "Queued" },
  { value: "sent", label: "Sent" },
  { value: "opened", label: "Opened" },
  { value: "clicked", label: "Clicked" },
  { value: "replied", label: "Replied" },
  { value: "bounced", label: "Bounced" },
  { value: "unsubscribed", label: "Unsubscribed" },
];

interface CampaignLeadRow {
  id: string;
  leadId: string | null;
  leadName: string;
  email: string | null;
  emailStatus: CampaignLeadEmailStatus;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  repliedAt: string | null;
  bouncedAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function CampaignLeadsTable({ campaignId }: { campaignId: string }) {
  const [rows, setRows] = useState<CampaignLeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState("any");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (statusFilter !== "any") params.set("status", statusFilter);

    fetch(`/api/campaigns/${campaignId}/leads?${params.toString()}`)
      .then(async (response) => {
        if (requestId !== requestIdRef.current) return;
        if (!response.ok) throw new Error("Couldn't load campaign recipients.");
        const data = (await response.json()) as {
          rows: CampaignLeadRow[];
          total: number;
        };
        setRows(data.rows);
        setTotal(data.total);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        setLoadError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsLoading(false);
      });
  }, [campaignId, page, pageSize, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Recipients</h2>
        <Select
          value={statusFilter}
          onValueChange={(v: string | null) => v && setStatusFilter(v)}
        >
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadError ? (
        <Card>
          <CardContent className="text-destructive px-6 py-12 text-center text-sm">
            {loadError}
          </CardContent>
        </Card>
      ) : !isLoading && rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <Users
              className="text-muted-foreground mb-3 size-8"
              aria-hidden="true"
            />
            <h3 className="text-base font-semibold">No recipients yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              Add leads to this campaign from the Leads page&apos;s bulk
              actions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Replied</TableHead>
                  <TableHead>Bounced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-48 truncate font-medium">
                      {row.leadName}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-56 truncate">
                      {row.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <CampaignLeadStatusPill status={row.emailStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.sentAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.openedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.clickedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.repliedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.bouncedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-3 sm:hidden">
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.leadName}</p>
                      <p className="text-muted-foreground text-xs">
                        {row.email ?? "No email"}
                      </p>
                    </div>
                    <CampaignLeadStatusPill status={row.emailStatus} />
                  </div>
                  <div className="text-muted-foreground grid grid-cols-2 gap-1 text-xs">
                    <span>Sent: {formatDate(row.sentAt)}</span>
                    <span>Opened: {formatDate(row.openedAt)}</span>
                    <span>Clicked: {formatDate(row.clickedAt)}</span>
                    <span>Replied: {formatDate(row.repliedAt)}</span>
                    <span>Bounced: {formatDate(row.bouncedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {isLoading
                ? "Loading…"
                : `Showing ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${total.toLocaleString()}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
