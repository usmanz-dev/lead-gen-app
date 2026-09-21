"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, Radar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppSidebarNav } from "@/components/dashboard/app-sidebar-nav";
import { useState } from "react";

function initialsFor(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "?";
}

export function AppTopbar({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string | null;
}) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-border bg-background flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" />}>
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="border-border border-b">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Radar className="text-primary size-5" aria-hidden="true" />
                LocalLeads AI
              </SheetTitle>
            </SheetHeader>
            <AppSidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="gap-2 px-1.5">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">
                  {initialsFor(userName, userEmail)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {userName ?? userEmail}
              </span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {userName ?? "Account"}
              </span>
              <span className="text-muted-foreground text-xs">{userEmail}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
