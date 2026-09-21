"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS } from "@/components/dashboard/nav-items";

export function AppSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.comingSoon) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              title="Coming soon"
              className="text-muted-foreground/50 flex cursor-not-allowed items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </span>
              <Badge
                variant="outline"
                className="pointer-events-none px-1.5 py-0 text-[10px] font-normal"
              >
                Soon
              </Badge>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
