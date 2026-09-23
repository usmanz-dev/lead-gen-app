"use client";

import { useState } from "react";
import type { DailyLeadCount } from "@/lib/dashboard";

const CHART_HEIGHT = 160;
const BAR_MAX_WIDTH = 20;

function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LeadsChart({ data }: { data: DailyLeadCount[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  // Label roughly every 5th day so 30 labels don't collide, always
  // including the first and last day.
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <div className="relative">
      <div
        role="img"
        aria-label={`Leads collected per day over the last ${data.length} days, ranging from 0 to ${maxCount}`}
        className="flex items-end gap-1"
        style={{ height: CHART_HEIGHT }}
      >
        {data.map((day, i) => {
          const heightPercent = (day.count / maxCount) * 100;
          // Sequential fill: taller (more leads) bars are drawn fully
          // opaque; shorter ones fade toward the track color, so relative
          // magnitude reads at a glance even before hovering.
          const opacity =
            day.count === 0 ? 0 : 0.35 + (heightPercent / 100) * 0.65;
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={day.date}
              className="group relative flex-1"
              style={{ maxWidth: BAR_MAX_WIDTH, height: CHART_HEIGHT }}
              onPointerEnter={() => setHoveredIndex(i)}
              onPointerLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(i)}
              onBlur={() => setHoveredIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${formatShortDate(day.date)}: ${day.count} lead${day.count === 1 ? "" : "s"}`}
            >
              <div className="bg-primary/10 absolute inset-x-0 top-0 bottom-0 rounded-t-sm" />
              <div
                className="bg-primary absolute inset-x-0 bottom-0 rounded-t-sm transition-[height,opacity] duration-150 ease-in-out"
                style={{
                  height: `${Math.max(heightPercent, day.count > 0 ? 2 : 0)}%`,
                  opacity,
                  outline: isHovered
                    ? "2px solid var(--color-primary)"
                    : undefined,
                  outlineOffset: isHovered ? "1px" : undefined,
                }}
              />

              {isHovered && (
                <div className="border-border bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md">
                  <div className="font-semibold">{day.count} leads</div>
                  <div className="text-muted-foreground">
                    {formatShortDate(day.date)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-muted-foreground mt-2 flex justify-between text-xs">
        {data.map((day, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <span key={day.date}>{formatShortDate(day.date)}</span>
          ) : null
        )}
      </div>

      {/* Accessible data table — the same data as the chart, for anyone
          who can't hover/focus each bar. */}
      <table className="sr-only">
        <caption>Leads collected per day, last {data.length} days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Leads</th>
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
