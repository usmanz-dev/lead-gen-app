import {
  CircleCheck,
  TriangleAlert,
  CircleX,
  CircleHelp,
  Globe,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  EmailValidationStatus,
  LeadStatus,
} from "@/lib/types/database.types";

export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>;
  const variant =
    score >= 60 ? "success" : score >= 30 ? "warning" : "secondary";
  return <Badge variant={variant}>{score}</Badge>;
}

const STATUS_STYLES: Record<
  LeadStatus,
  { label: string; variant: "secondary" | "warning" | "success" | "outline" }
> = {
  new: { label: "New", variant: "secondary" },
  contacted: { label: "Contacted", variant: "warning" },
  interested: { label: "Interested", variant: "success" },
  closed: { label: "Closed", variant: "outline" },
};

export function StatusPill({ status }: { status: LeadStatus }) {
  const style = STATUS_STYLES[status];
  return <Badge variant={style.variant}>{style.label}</Badge>;
}

const EMAIL_STYLES: Record<
  EmailValidationStatus,
  { Icon: typeof CircleCheck; className: string; label: string }
> = {
  valid: { Icon: CircleCheck, className: "text-success", label: "Valid" },
  risky: { Icon: TriangleAlert, className: "text-warning", label: "Risky" },
  invalid: { Icon: CircleX, className: "text-destructive", label: "Invalid" },
  unknown: {
    Icon: CircleHelp,
    className: "text-muted-foreground",
    label: "Not validated",
  },
};

export function EmailCell({
  email,
  status,
}: {
  email: string | null;
  status: EmailValidationStatus;
}) {
  if (!email) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        <Ban className="size-3.5" aria-hidden="true" />
        Not found
      </span>
    );
  }

  const { Icon, className, label } = EMAIL_STYLES[status];
  return (
    <span className="inline-flex max-w-full items-center gap-1.5" title={label}>
      <Icon className={cn("size-3.5 shrink-0", className)} aria-hidden="true" />
      <span className="truncate">{email}</span>
    </span>
  );
}

export function WebsiteCell({ url }: { url: string | null }) {
  if (!url) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        <Ban className="size-3.5" aria-hidden="true" />
        None
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary inline-flex items-center gap-1 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <Globe className="size-3.5" aria-hidden="true" />
      Visit
    </a>
  );
}
