"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="border-border bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Radar className="text-primary size-5" aria-hidden="true" />
          <span>LocalLeads AI</span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="text-muted-foreground hidden items-center gap-6 text-sm font-medium md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors duration-150 ease-in-out"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" render={<Link href="/login" />}>
            Log in
          </Button>
          <Button render={<Link href="/signup" />}>Start Free Trial</Button>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" />}
            className="md:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="p-0">
            <SheetHeader className="border-border border-b">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Radar className="text-primary size-5" aria-hidden="true" />
                LocalLeads AI
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="hover:bg-muted rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-in-out"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="border-border mt-auto flex flex-col gap-2 border-t p-3">
              <Button
                variant="outline"
                render={<Link href="/login" />}
                onClick={() => setMobileNavOpen(false)}
              >
                Log in
              </Button>
              <Button
                render={<Link href="/signup" />}
                onClick={() => setMobileNavOpen(false)}
              >
                Start Free Trial
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
