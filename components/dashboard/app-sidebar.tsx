"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radar, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AppSidebarNav } from "@/components/dashboard/app-sidebar-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sidebar-collapsed";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable (private mode, etc.) — default expanded.
    }
    setHydrated(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Non-fatal — the preference just won't persist this session.
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "border-border bg-sidebar hidden shrink-0 flex-col border-r transition-[width] duration-200 ease-in-out md:flex",
        collapsed ? "w-16" : "w-64",
        !hydrated && "invisible"
      )}
    >
      <div className="border-border flex h-16 items-center justify-between gap-2 border-b px-3 font-semibold">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 overflow-hidden",
            collapsed && "justify-center"
          )}
        >
          <Radar className="text-primary size-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">LocalLeads AI</span>}
        </Link>
      </div>
      <AppSidebarNav collapsed={collapsed} />
      <div className="border-border border-t p-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="w-full"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </aside>
  );
}
