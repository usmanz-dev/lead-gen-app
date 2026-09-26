"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search as SearchIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  LeadsToolbar,
  type LeadsFilterState,
} from "@/components/dashboard/leads-toolbar";
import { LeadsBulkActionsBar } from "@/components/dashboard/leads-bulk-actions-bar";
import { LeadRowActionsMenu } from "@/components/dashboard/leads-row-actions-menu";
import {
  ScoreBadge,
  StatusPill,
  EmailCell,
  WebsiteCell,
} from "@/components/dashboard/lead-badges";
import { LeadDetailSheet } from "@/components/dashboard/lead-detail-sheet";
import { AddToCampaignDialog } from "@/components/dashboard/add-to-campaign-dialog";
import { DeleteLeadsDialog } from "@/components/dashboard/delete-leads-dialog";
import {
  deleteLeads,
  validateLeadEmails,
  addLeadsToCampaign,
} from "@/app/(dashboard)/dashboard/leads/actions";
import type { LeadListRow } from "@/lib/types/leads-table";

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const DEBOUNCE_MS = 300;

interface InitialSearchFilter {
  id: string;
  label: string;
}

export function LeadsTable({
  initialSearchFilter,
}: {
  initialSearchFilter: InitialSearchFilter | null;
}) {
  const [filters, setFilters] = useState<LeadsFilterState>({
    q: "",
    status: [],
    minScore: "",
    maxScore: "",
    hasEmail: "any",
    sortBy: "opportunity_score",
    sortDir: "desc",
  });
  const [searchIdFilter, setSearchIdFilter] =
    useState<InitialSearchFilter | null>(initialSearchFilter);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [rows, setRows] = useState<LeadListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [campaignDialog, setCampaignDialog] = useState<{
    open: boolean;
    leadIds: string[];
  }>({ open: false, leadIds: [] });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    leadIds: string[];
  }>({ open: false, leadIds: [] });
  const [isBulkBusy, setIsBulkBusy] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const filtersKey = JSON.stringify({ filters, searchId: searchIdFilter?.id });
  const requestIdRef = useRef(0);

  const buildParams = useCallback(
    (forExport: boolean) => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.status.length > 0)
        params.set("status", filters.status.join(","));
      if (filters.minScore) params.set("minScore", filters.minScore);
      if (filters.maxScore) params.set("maxScore", filters.maxScore);
      if (filters.hasEmail !== "any") params.set("hasEmail", filters.hasEmail);
      if (searchIdFilter) params.set("searchId", searchIdFilter.id);
      params.set("sortBy", filters.sortBy);
      params.set("sortDir", filters.sortDir);
      if (!forExport) {
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
      }
      return params;
    },
    [filters, searchIdFilter, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const params = buildParams(false);
        const response = await fetch(`/api/leads?${params.toString()}`);
        if (requestId !== requestIdRef.current) return;
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "Couldn't load leads.");
        }
        const data = (await response.json()) as {
          rows: LeadListRow[];
          total: number;
        };
        if (requestId !== requestIdRef.current) return;
        setRows(data.rows);
        setTotal(data.total);
        setSelectedIds(new Set());
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setLoadError(
          err instanceof Error ? err.message : "Couldn't load leads."
        );
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, page, pageSize, refreshToken]);

  function refetch() {
    setRefreshToken((t) => t + 1);
  }

  const allSelected =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(rows.map((r) => r.id)) : new Set());
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleExportCsv(ids: string[]) {
    const params =
      ids.length > 0
        ? new URLSearchParams({ ids: ids.join(",") })
        : buildParams(true);
    window.open(`/api/leads/export?${params.toString()}`, "_blank");
  }

  async function handleDeleteConfirm() {
    setIsBulkBusy(true);
    try {
      await deleteLeads(deleteDialog.leadIds);
      setNotice({
        type: "success",
        message: `Deleted ${deleteDialog.leadIds.length} ${deleteDialog.leadIds.length === 1 ? "lead" : "leads"}.`,
      });
      setDeleteDialog({ open: false, leadIds: [] });
      setDetailLeadId(null);
      if (deleteDialog.leadIds.length >= rows.length && page > 1) {
        setPage((p) => p - 1);
      } else {
        refetch();
      }
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't delete.",
      });
    } finally {
      setIsBulkBusy(false);
    }
  }

  async function handleValidateEmails(ids: string[]) {
    setIsBulkBusy(true);
    try {
      const result = await validateLeadEmails(ids);
      setNotice({
        type: "success",
        message: `Checked ${result.checked} ${result.checked === 1 ? "email" : "emails"}.`,
      });
      refetch();
    } catch (err) {
      setNotice({
        type: "error",
        message:
          err instanceof Error ? err.message : "Couldn't validate emails.",
      });
    } finally {
      setIsBulkBusy(false);
    }
  }

  async function handleCampaignSubmit(
    input: Parameters<typeof addLeadsToCampaign>[1]
  ) {
    const result = await addLeadsToCampaign(campaignDialog.leadIds, input);
    setNotice({
      type: "success",
      message: `Added ${result.addedCount} ${result.addedCount === 1 ? "lead" : "leads"} to the campaign.`,
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <LeadsToolbar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        searchFilterLabel={searchIdFilter?.label ?? null}
        onClearSearchFilter={() => setSearchIdFilter(null)}
      />

      {selectedIds.size > 0 && (
        <LeadsBulkActionsBar
          selectedCount={selectedIds.size}
          isBusy={isBulkBusy}
          onExport={() => handleExportCsv(Array.from(selectedIds))}
          onAddToCampaign={() =>
            setCampaignDialog({ open: true, leadIds: Array.from(selectedIds) })
          }
          onDelete={() =>
            setDeleteDialog({ open: true, leadIds: Array.from(selectedIds) })
          }
          onValidateEmails={() => handleValidateEmails(Array.from(selectedIds))}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

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

      {loadError ? (
        <Card>
          <CardContent className="text-destructive flex flex-col items-center px-6 py-16 text-center text-sm">
            {loadError}
          </CardContent>
        </Card>
      ) : !isLoading && rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <SearchIcon
              className="text-muted-foreground mb-3 size-8"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold">No leads found</h2>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              {filters.q ||
              filters.status.length > 0 ||
              filters.minScore ||
              filters.maxScore
                ? "No leads match your current filters — try broadening them."
                : "Run a lead search to start building your pipeline."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={(checked: boolean) =>
                        toggleSelectAll(checked)
                      }
                      aria-label="Select all leads on this page"
                    />
                  </TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => setDetailLeadId(lead.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(lead.id)}
                        onCheckedChange={(checked: boolean) =>
                          toggleRow(lead.id, checked)
                        }
                        aria-label={`Select ${lead.name}`}
                      />
                    </TableCell>
                    <TableCell className="max-w-48 truncate font-medium">
                      {lead.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.category ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <WebsiteCell url={lead.website_url} />
                    </TableCell>
                    <TableCell>
                      {lead.rating !== null ? lead.rating.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.review_count.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={lead.opportunity_score} />
                    </TableCell>
                    <TableCell className="max-w-56">
                      <EmailCell
                        email={lead.email}
                        status={lead.email_validation_status}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusPill status={lead.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <LeadRowActionsMenu
                        onView={() => setDetailLeadId(lead.id)}
                        onAddToCampaign={() =>
                          setCampaignDialog({ open: true, leadIds: [lead.id] })
                        }
                        onDelete={() =>
                          setDeleteDialog({ open: true, leadIds: [lead.id] })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile stacked cards */}
          <div className="space-y-3 sm:hidden">
            {rows.map((lead) => (
              <Card
                key={lead.id}
                onClick={() => setDetailLeadId(lead.id)}
                className="cursor-pointer"
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          onCheckedChange={(checked: boolean) =>
                            toggleRow(lead.id, checked)
                          }
                          aria-label={`Select ${lead.name}`}
                          className="mt-0.5"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {lead.category ?? "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StatusPill status={lead.status} />
                      <LeadRowActionsMenu
                        onView={() => setDetailLeadId(lead.id)}
                        onAddToCampaign={() =>
                          setCampaignDialog({ open: true, leadIds: [lead.id] })
                        }
                        onDelete={() =>
                          setDeleteDialog({ open: true, leadIds: [lead.id] })
                        }
                      />
                    </div>
                  </div>

                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span>{lead.phone ?? "No phone"}</span>
                    {lead.rating !== null && (
                      <span>
                        {lead.rating.toFixed(1)} ★ ({lead.review_count})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <WebsiteCell url={lead.website_url} />
                    </div>
                    <ScoreBadge score={lead.opportunity_score} />
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <EmailCell
                      email={lead.email}
                      status={lead.email_validation_status}
                    />
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
              <Select
                value={String(pageSize)}
                onValueChange={(value: string | null) =>
                  value && setPageSize(Number(value))
                }
              >
                <SelectTrigger className="w-28" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      <LeadDetailSheet
        leadId={detailLeadId}
        onOpenChange={(open) => !open && setDetailLeadId(null)}
        onAddToCampaign={(leadId) =>
          setCampaignDialog({ open: true, leadIds: [leadId] })
        }
        onDelete={(leadId) =>
          setDeleteDialog({ open: true, leadIds: [leadId] })
        }
      />

      <AddToCampaignDialog
        open={campaignDialog.open}
        onOpenChange={(open) => setCampaignDialog((d) => ({ ...d, open }))}
        leadCount={campaignDialog.leadIds.length}
        onSubmit={handleCampaignSubmit}
      />

      <DeleteLeadsDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}
        count={deleteDialog.leadIds.length}
        isDeleting={isBulkBusy}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
