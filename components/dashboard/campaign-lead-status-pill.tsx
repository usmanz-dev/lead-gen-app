import { Badge } from "@/components/ui/badge";
import type { CampaignLeadEmailStatus } from "@/lib/types/database.types";

const STATUS_STYLES: Record<
  CampaignLeadEmailStatus,
  {
    label: string;
    variant: "secondary" | "warning" | "success" | "destructive" | "outline";
  }
> = {
  queued: { label: "Queued", variant: "secondary" },
  sent: { label: "Sent", variant: "outline" },
  opened: { label: "Opened", variant: "outline" },
  clicked: { label: "Clicked", variant: "outline" },
  replied: { label: "Replied", variant: "success" },
  bounced: { label: "Bounced", variant: "destructive" },
  unsubscribed: { label: "Unsubscribed", variant: "warning" },
};

export function CampaignLeadStatusPill({
  status,
}: {
  status: CampaignLeadEmailStatus;
}) {
  const style = STATUS_STYLES[status];
  return <Badge variant={style.variant}>{style.label}</Badge>;
}
