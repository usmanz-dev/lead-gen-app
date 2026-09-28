import type { WarmupProgress } from "@/lib/sender-warmup";

export function WarmupProgressBar({ warmup }: { warmup: WarmupProgress }) {
  if (warmup.phase === "disabled") {
    return (
      <p className="text-muted-foreground text-sm">
        Warm-up is off — sending at the full {warmup.targetDailyLimit}/day
        limit.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {warmup.phase === "completed"
            ? "Warm-up complete"
            : `Day ${warmup.dayNumber} of ${warmup.totalDays}`}
        </span>
        <span className="text-muted-foreground">
          {warmup.currentDailyLimit}/day
          {warmup.phase !== "completed" && ` → ${warmup.targetDailyLimit}/day`}
        </span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-300 ease-in-out"
          style={{ width: `${warmup.percent}%` }}
        />
      </div>
    </div>
  );
}
