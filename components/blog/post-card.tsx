import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPostDate, type Post } from "@/lib/blog";

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Local SEO": "from-primary/30 to-primary/5",
  "Cold Outreach": "from-success/30 to-success/5",
  "Product Updates": "from-destructive/20 to-destructive/5",
};

export function PostCard({ post }: { post: Post }) {
  const gradient =
    CATEGORY_GRADIENTS[post.category] ?? "from-secondary to-background";

  return (
    <Link href={`/blog/${post.slug}`} className="block h-full">
      <Card className="border-border/60 flex h-full flex-col overflow-hidden py-0">
        <div className={`flex h-32 items-end bg-linear-to-br p-4 ${gradient}`}>
          <Badge variant="secondary">{post.category}</Badge>
        </div>
        <CardHeader className="pt-4">
          <CardTitle className="text-base leading-snug">{post.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {post.excerpt}
          </p>
          <p className="text-muted-foreground mt-4 text-xs">
            {post.author_name} · {formatPostDate(post.published_at)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
