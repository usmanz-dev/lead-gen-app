import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel = "vs last month",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Percent change vs. last month; null when there's not enough history yet. */
  trend?: number | null;
  trendLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {label}
        </CardTitle>
        <Icon className="text-muted-foreground size-4" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {trend !== undefined && (
          <p className="mt-1 flex items-center gap-1 text-xs">
            {trend === null ? (
              <span className="text-muted-foreground">Not enough data yet</span>
            ) : (
              <>
                <span
                  className={cn(
                    "flex items-center gap-0.5 font-medium",
                    trend > 0 && "text-success",
                    trend < 0 && "text-destructive",
                    trend === 0 && "text-muted-foreground"
                  )}
                >
                  {trend > 0 && (
                    <ArrowUp className="size-3" aria-hidden="true" />
                  )}
                  {trend < 0 && (
                    <ArrowDown className="size-3" aria-hidden="true" />
                  )}
                  {trend === 0 ? "No change" : `${Math.abs(trend)}%`}
                </span>
                <span className="text-muted-foreground">{trendLabel}</span>
              </>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
