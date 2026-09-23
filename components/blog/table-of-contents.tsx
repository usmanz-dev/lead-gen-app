import type { Heading } from "@/lib/blog";
import { cn } from "@/lib/utils";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="border-border bg-secondary/40 rounded-xl border p-5"
    >
      <p className="text-sm font-semibold">On this page</p>
      <ul className="mt-3 space-y-2 text-sm">
        {headings.map((heading) => (
          <li key={heading.id} className={cn(heading.level === 3 && "pl-3")}>
            <a
              href={`#${heading.id}`}
              className="text-muted-foreground hover:text-foreground block transition-colors duration-150 ease-in-out"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
