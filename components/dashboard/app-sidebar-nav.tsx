"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NAV_ITEMS, type NavItem } from "@/components/dashboard/nav-items";

export function AppSidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const content = (
          <NavRow
            item={item}
            isActive={isActive}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        );

        if (!collapsed) return <div key={item.href}>{content}</div>;

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger render={<div />}>{content}</TooltipTrigger>
            <TooltipContent side="right">
              {item.label}
              {item.comingSoon && " (Coming soon)"}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

function NavRow({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <span
        aria-disabled="true"
        title={collapsed ? undefined : "Coming soon"}
        className={cn(
          "text-muted-foreground/50 flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <span className="flex items-center gap-2">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed && item.label}
        </span>
        {!collapsed && (
          <Badge
            variant="outline"
            className="pointer-events-none px-1.5 py-0 text-[10px] font-normal"
          >
            Soon
          </Badge>
        )}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed && item.label}
    </Link>
  );
}
