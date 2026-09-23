import Link from "next/link";
import { Radar } from "lucide-react";
import {
  XIcon,
  LinkedInIcon,
  GitHubIcon,
} from "@/components/marketing/social-icons";

const PRODUCT_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
];

// Placeholder — swap in the real handles once these are live.
const SOCIAL_LINKS = [
  {
    href: "https://twitter.com/localleadsai",
    label: "X (Twitter)",
    icon: XIcon,
  },
  {
    href: "https://linkedin.com/company/localleadsai",
    label: "LinkedIn",
    icon: LinkedInIcon,
  },
  {
    href: "https://github.com/localleadsai",
    label: "GitHub",
    icon: GitHubIcon,
  },
];

export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Radar className="text-primary size-5" aria-hidden="true" />
              <span>LocalLeads AI</span>
            </Link>
            <p className="text-muted-foreground mt-3 text-sm">
              Find local businesses that need you, before your competitors do.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-8 items-center justify-center rounded-lg transition-colors duration-150 ease-in-out"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-3 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-150 ease-in-out"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-150 ease-in-out"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <a
                  href="mailto:support@localleads.ai"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-150 ease-in-out"
                >
                  support@localleads.ai
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-150 ease-in-out"
                >
                  Log in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-10 border-t pt-6 text-sm">
          &copy; {new Date().getFullYear()} LocalLeads AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
