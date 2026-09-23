"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  Radar,
  Search,
  Bell,
  User,
  CreditCard,
  BellOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    <header className="border-border bg-background flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
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

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search
          className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          disabled
          placeholder="Search leads, campaigns… (coming soon)"
          className="pl-8"
          aria-label="Search (coming soon)"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
            <Bell className="size-5" aria-hidden="true" />
            <span className="sr-only">Notifications</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
              <BellOff className="size-5" aria-hidden="true" />
              You&apos;re all caught up — nothing new yet.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
                <span className="text-muted-foreground text-xs">
                  {userEmail}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="size-4" aria-hidden="true" />
              Account
              <Badge
                variant="outline"
                className="ml-auto px-1.5 py-0 text-[10px] font-normal"
              >
                Soon
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <CreditCard className="size-4" aria-hidden="true" />
              Billing
              <Badge
                variant="outline"
                className="ml-auto px-1.5 py-0 text-[10px] font-normal"
              >
                Soon
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
