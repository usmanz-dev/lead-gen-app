import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function severity(percent: number): "ok" | "warning" | "critical" {
  if (percent >= 100) return "critical";
  if (percent >= 80) return "warning";
  return "ok";
}

const FILL_CLASS: Record<ReturnType<typeof severity>, string> = {
  ok: "bg-primary",
  warning: "bg-warning",
  critical: "bg-destructive",
};

const TRACK_CLASS: Record<ReturnType<typeof severity>, string> = {
  ok: "bg-primary/10",
  warning: "bg-warning/15",
  critical: "bg-destructive/15",
};

export function UsageCard({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const percent =
    limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const state = severity(percent);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {label}
        </CardTitle>
        {state !== "ok" && (
          <AlertTriangle
            className={cn(
              "size-4",
              state === "warning" ? "text-warning" : "text-destructive"
            )}
            aria-hidden="true"
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tabular-nums">
            {used.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-sm">
            / {limit.toLocaleString()}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${percent}% used`}
          className={cn(
            "mt-3 h-1.5 w-full overflow-hidden rounded-full",
            TRACK_CLASS[state]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 ease-in-out",
              FILL_CLASS[state]
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          {percent}% used this cycle
        </p>
      </CardContent>
    </Card>
  );
}
