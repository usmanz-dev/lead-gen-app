"use client";

import type { MouseEvent } from "react";
import { MoreHorizontal, Eye, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function LeadRowActionsMenu({
  onView,
  onAddToCampaign,
  onDelete,
}: {
  onView: () => void;
  onAddToCampaign: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" />}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
        <span className="sr-only">Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="size-4" aria-hidden="true" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddToCampaign}>
          <Send className="size-4" aria-hidden="true" />
          Add to Campaign
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
