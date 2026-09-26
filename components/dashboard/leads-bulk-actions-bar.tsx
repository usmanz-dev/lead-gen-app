"use client";

import { Download, Send, Trash2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LeadsBulkActionsBar({
  selectedCount,
  isBusy,
  onExport,
  onAddToCampaign,
  onDelete,
  onValidateEmails,
  onClear,
}: {
  selectedCount: number;
  isBusy: boolean;
  onExport: () => void;
  onAddToCampaign: () => void;
  onDelete: () => void;
  onValidateEmails: () => void;
  onClear: () => void;
}) {
  return (
    <div className="border-border bg-muted/50 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={onExport}
        >
          <Download className="size-3.5" aria-hidden="true" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={onAddToCampaign}
        >
          <Send className="size-3.5" aria-hidden="true" />
          Add to Campaign
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={onValidateEmails}
        >
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Validate Emails
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={isBusy}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
