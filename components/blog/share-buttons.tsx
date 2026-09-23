"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { XIcon, LinkedInIcon } from "@/components/marketing/social-icons";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: "Share on X",
      icon: XIcon,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      label: "Share on LinkedIn",
      icon: LinkedInIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing to
      // recover into here; the link is still visible in the address bar.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm font-medium">Share:</span>
      {shareLinks.map(({ label, icon: Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-8 items-center justify-center rounded-lg transition-colors duration-150 ease-in-out"
        >
          <Icon className="size-4" aria-hidden="true" />
        </a>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={copyLink}
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="text-success size-4" aria-hidden="true" />
        ) : (
          <Link2 className="size-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
