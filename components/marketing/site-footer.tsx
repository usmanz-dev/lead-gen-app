import { Radar } from "lucide-react";

const FOOTER_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-semibold">
          <Radar className="text-primary size-5" aria-hidden="true" />
          <span>LocalLeads AI</span>
        </div>

        <nav
          aria-label="Footer navigation"
          className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
        >
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="mailto:support@localleads.ai"
            className="hover:text-foreground transition-colors"
          >
            support@localleads.ai
          </a>
        </nav>

        <p className="text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} LocalLeads AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
