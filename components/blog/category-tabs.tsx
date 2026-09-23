import Link from "next/link";
import { cn } from "@/lib/utils";

export function CategoryTabs({
  categories,
  activeCategory,
}: {
  categories: string[];
  activeCategory?: string;
}) {
  return (
    <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={cn(
          "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-in-out",
          !activeCategory
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card hover:bg-muted"
        )}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={`/blog?category=${encodeURIComponent(category)}`}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-in-out",
            activeCategory === category
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-muted"
          )}
        >
          {category}
        </Link>
      ))}
    </nav>
  );
}
