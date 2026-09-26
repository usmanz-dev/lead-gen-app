"use client";

import { Search, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { LeadStatus } from "@/lib/types/database.types";
import type { LeadSortColumn } from "@/lib/validations/leads-query";

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "closed", label: "Closed" },
];

const SORT_OPTIONS: Array<{ value: LeadSortColumn; label: string }> = [
  { value: "opportunity_score", label: "Opportunity score" },
  { value: "name", label: "Business name" },
  { value: "rating", label: "Rating" },
  { value: "review_count", label: "Reviews" },
  { value: "status", label: "Status" },
  { value: "created_at", label: "Date added" },
];

export interface LeadsFilterState {
  q: string;
  status: LeadStatus[];
  minScore: string;
  maxScore: string;
  hasEmail: "yes" | "no" | "any";
  sortBy: LeadSortColumn;
  sortDir: "asc" | "desc";
}

export function LeadsToolbar({
  filters,
  onChange,
  searchFilterLabel,
  onClearSearchFilter,
}: {
  filters: LeadsFilterState;
  onChange: (patch: Partial<LeadsFilterState>) => void;
  searchFilterLabel: string | null;
  onClearSearchFilter: () => void;
}) {
  const activeFilterCount =
    filters.status.length +
    (filters.minScore ? 1 : 0) +
    (filters.maxScore ? 1 : 0) +
    (filters.hasEmail !== "any" ? 1 : 0);

  function toggleStatus(value: LeadStatus, checked: boolean) {
    onChange({
      status: checked
        ? [...filters.status, value]
        : filters.status.filter((s) => s !== value),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-64">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Search leads…"
            className="pl-8"
            aria-label="Search within results"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Status
            {filters.status.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {filters.status.length}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.status.includes(option.value)}
                onCheckedChange={(checked: boolean) =>
                  toggleStatus(option.value, checked)
                }
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={100}
            value={filters.minScore}
            onChange={(e) => onChange({ minScore: e.target.value })}
            placeholder="Min score"
            className="w-24"
            aria-label="Minimum opportunity score"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={filters.maxScore}
            onChange={(e) => onChange({ maxScore: e.target.value })}
            placeholder="Max score"
            className="w-24"
            aria-label="Maximum opportunity score"
          />
        </div>

        <Select
          value={filters.hasEmail}
          onValueChange={(value: string | null) =>
            value &&
            onChange({ hasEmail: value as LeadsFilterState["hasEmail"] })
          }
        >
          <SelectTrigger className="w-36" aria-label="Filter by email">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any email status</SelectItem>
            <SelectItem value="yes">Has email</SelectItem>
            <SelectItem value="no">No email</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1.5">
          <Select
            value={filters.sortBy}
            onValueChange={(value: string | null) =>
              value && onChange({ sortBy: value as LeadSortColumn })
            }
          >
            <SelectTrigger className="w-44" aria-label="Sort by">
              <ArrowUpDown className="size-3.5" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label={
              filters.sortDir === "asc" ? "Sort ascending" : "Sort descending"
            }
            onClick={() =>
              onChange({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" })
            }
          >
            {filters.sortDir === "asc" ? (
              <ArrowUp className="size-4" aria-hidden="true" />
            ) : (
              <ArrowDown className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                status: [],
                minScore: "",
                maxScore: "",
                hasEmail: "any",
              })
            }
          >
            Clear filters
          </Button>
        )}
      </div>

      {searchFilterLabel && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            Filtered by search:
          </span>
          <Badge variant="secondary" className="gap-1">
            {searchFilterLabel}
            <button
              type="button"
              onClick={onClearSearchFilter}
              aria-label="Clear search filter"
              className="hover:text-foreground"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}
