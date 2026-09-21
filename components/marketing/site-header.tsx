import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Radar } from "lucide-react";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteHeader() {
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
            <a
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>
            Log in
          </Button>
          <Button render={<Link href="/signup" />}>Get started</Button>
        </div>
      </div>
    </header>
  );
}
