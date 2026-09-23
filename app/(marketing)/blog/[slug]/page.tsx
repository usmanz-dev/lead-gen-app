import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/blog/post-card";
import { PostContent } from "@/components/blog/post-content";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ShareButtons } from "@/components/blog/share-buttons";
import {
  getPostBySlug,
  getRelatedPosts,
  extractHeadings,
  formatPostDate,
  estimateReadingMinutes,
} from "@/lib/blog";

// New posts are added directly in the database — always fetch fresh.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Post not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const [relatedPosts, headings] = await Promise.all([
    getRelatedPosts(post.category, post.id),
    Promise.resolve(extractHeadings(post.content)),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const postUrl = `${appUrl}/blog/${post.slug}`;

  return (
    <article className="mx-auto max-w-175 px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-150 ease-in-out"
        >
          ← Back to blog
        </Link>

        <Badge variant="secondary" className="mt-6">
          {post.category}
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {post.title}
        </h1>

        <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>
            {post.author_name} · {formatPostDate(post.published_at)} ·{" "}
            {estimateReadingMinutes(post.content)} min read
          </span>
          <ShareButtons url={postUrl} title={post.title} />
        </div>
      </Reveal>

      {headings.length >= 3 && (
        <Reveal delay={0.05} className="mt-8">
          <TableOfContents headings={headings} />
        </Reveal>
      )}

      <Reveal delay={0.05} className="mt-8">
        <PostContent markdown={post.content} />
      </Reveal>

      {relatedPosts.length > 0 && (
        <Reveal delay={0.05} className="mt-20">
          <h2 className="text-lg font-semibold tracking-tight">
            More in {post.category}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4">
            {relatedPosts.map((related) => (
              <PostCard key={related.id} post={related} />
            ))}
          </div>
        </Reveal>
      )}
    </article>
  );
}
