import {
  Search,
  Send,
  MessageCircleReply,
  OctagonX,
  type LucideIcon,
} from "lucide-react";
import type { ActivityEvent, ActivityEventType } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const EVENT_CONFIG: Record<
  ActivityEventType,
  { icon: LucideIcon; iconClass: string }
> = {
  search_completed: { icon: Search, iconClass: "bg-primary/10 text-primary" },
  email_sent: { icon: Send, iconClass: "bg-primary/10 text-primary" },
  lead_replied: {
    icon: MessageCircleReply,
    iconClass: "bg-success/10 text-success",
  },
  email_bounced: {
    icon: OctagonX,
    iconClass: "bg-destructive/10 text-destructive",
  },
};

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No activity yet — it&apos;ll show up here as soon as something happens.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {events.map((event) => {
        const { icon: Icon, iconClass } = EVENT_CONFIG[event.type];
        return (
          <li key={event.id} className="flex items-start gap-3 py-2">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                iconClass
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{event.message}</p>
              <time
                dateTime={event.timestamp}
                className="text-muted-foreground text-xs"
              >
                {formatRelativeTime(event.timestamp)}
              </time>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
