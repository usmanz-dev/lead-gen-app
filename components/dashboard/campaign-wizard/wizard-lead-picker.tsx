"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { EmailCell } from "@/components/dashboard/lead-badges";
import type { LeadListRow } from "@/lib/types/leads-table";

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 10;

export function WizardLeadPicker({
  selectedIds,
  onToggle,
}: {
  selectedIds: Set<string>;
  onToggle: (lead: { id: string; name: string }, checked: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("any");
  const [hasEmail, setHasEmail] = useState("yes");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LeadListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => setPage(1), [q, status, hasEmail]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (q) params.set("q", q);
      if (status !== "any") params.set("status", status);
      if (hasEmail !== "any") params.set("hasEmail", hasEmail);

      try {
        const response = await fetch(`/api/leads?${params.toString()}`);
        if (requestId !== requestIdRef.current) return;
        const data = (await response.json()) as {
          rows: LeadListRow[];
          total: number;
        };
        setRows(data.rows);
        setTotal(data.total);
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [q, status, hasEmail, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-40 flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads…"
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v: string | null) => v && setStatus(v)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={hasEmail}
          onValueChange={(v: string | null) => v && setHasEmail(v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any email status</SelectItem>
            <SelectItem value="yes">Has email</SelectItem>
            <SelectItem value="no">No email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Business</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground py-8 text-center"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground py-8 text-center"
                >
                  No leads match these filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() => onToggle(lead, !selectedIds.has(lead.id))}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(lead.id)}
                      onCheckedChange={(checked: boolean) =>
                        onToggle(lead, checked)
                      }
                      aria-label={`Select ${lead.name}`}
                    />
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-medium">
                    {lead.name}
                  </TableCell>
                  <TableCell>
                    <EmailCell
                      email={lead.email}
                      status={lead.email_validation_status}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} matching leads
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <span className="text-muted-foreground text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
