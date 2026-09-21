import Link from "next/link";
import { Radar } from "lucide-react";
import { AppSidebarNav } from "@/components/dashboard/app-sidebar-nav";

export function AppSidebar() {
  return (
    <aside className="border-border bg-sidebar hidden w-64 shrink-0 flex-col border-r md:flex">
      <div className="border-border flex h-16 items-center gap-2 border-b px-4 font-semibold">
        <Link href="/" className="flex items-center gap-2">
          <Radar className="text-primary size-5" aria-hidden="true" />
          <span>LocalLeads AI</span>
        </Link>
      </div>
      <AppSidebarNav />
    </aside>
  );
}
