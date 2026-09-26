import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/lib/types/database.types";

const STATUS_STYLES: Record<
  CampaignStatus,
  { label: string; variant: "secondary" | "warning" | "success" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "outline" },
  sending: { label: "Sending", variant: "warning" },
  paused: { label: "Paused", variant: "outline" },
  completed: { label: "Completed", variant: "success" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const style = STATUS_STYLES[status];
  return <Badge variant={style.variant}>{style.label}</Badge>;
}
