import type { Metadata } from "next";
import { Reveal } from "@/components/ui/reveal";
import { PostCard } from "@/components/blog/post-card";
import { CategoryTabs } from "@/components/blog/category-tabs";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { getPublishedPosts, getCategories } from "@/lib/blog";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = { title: "Blog" };

// New posts are added directly in the database — always fetch fresh
// rather than caching a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const category = searchParams.category || undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [{ posts, totalPages }, categories] = await Promise.all([
    getPublishedPosts({ page, category }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          The blog
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Local SEO tactics, cold outreach guides, and product updates.
        </p>
      </Reveal>

      {categories.length > 0 && (
        <Reveal className="mt-10 flex justify-center">
          <CategoryTabs categories={categories} activeCategory={category} />
        </Reveal>
      )}

      {posts.length === 0 ? (
        <Reveal className="mx-auto mt-16 flex max-w-sm flex-col items-center text-center">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
            <Newspaper className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No posts here yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {category
              ? `Nothing published in "${category}" yet — check back soon.`
              : "Nothing published yet — check back soon."}
          </p>
        </Reveal>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={(i % 3) * 0.1}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      )}

      <BlogPagination page={page} totalPages={totalPages} category={category} />
    </div>
  );
}
