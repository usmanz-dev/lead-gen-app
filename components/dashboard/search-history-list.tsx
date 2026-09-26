import Link from "next/link";
import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchHistoryItem } from "@/lib/searches";

const STATUS_BADGE: Record<
  SearchHistoryItem["status"],
  {
    label: string;
    variant: "secondary" | "warning" | "success" | "destructive";
  }
> = {
  pending: { label: "Pending", variant: "secondary" },
  running: { label: "Running", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
};

export function SearchHistoryList({ items }: { items: SearchHistoryItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Search history</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center py-10 text-center text-sm">
            <History className="mb-2 size-6" aria-hidden="true" />
            Your past searches will show up here.
          </div>
        ) : (
          <ul className="divide-border -mx-6 divide-y sm:-mx-8">
            {items.map((item) => {
              const badge = STATUS_BADGE[item.status];
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 sm:px-8"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.keyword} — {item.location}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {item.status === "completed" &&
                        ` · ${item.leadsFound.toLocaleString()} ${
                          item.leadsFound === 1 ? "lead" : "leads"
                        }`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {item.status === "completed" ? (
                      <Link
                        href={`/dashboard/leads?search=${item.id}`}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        View
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        View
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
