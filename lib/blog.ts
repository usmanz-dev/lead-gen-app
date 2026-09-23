import "server-only";
import GithubSlugger from "github-slugger";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";

export type Post = Tables<"posts">;

export const POSTS_PER_PAGE = 9;

export interface PostsPage {
  posts: Post[];
  totalCount: number;
  totalPages: number;
}

export async function getPublishedPosts({
  page = 1,
  category,
}: {
  page?: number;
  category?: string;
}): Promise<PostsPage> {
  const supabase = await createClient();
  const from = (page - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  let query = supabase
    .from("posts")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, count } = await query;
  const totalCount = count ?? 0;

  return {
    posts: data ?? [],
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE)),
  };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function getRelatedPosts(
  category: string,
  excludeId: string,
  limit = 3
): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Distinct categories among published posts, for the filter tabs. */
export async function getCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("category")
    .eq("status", "published");

  return Array.from(new Set((data ?? []).map((row) => row.category))).sort();
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Extracts H2/H3 headings from markdown for the table of contents. Uses a
 * fresh GithubSlugger walking headings in source order — PostContent does
 * the same when it assigns heading ids while rendering, so as long as both
 * start from a fresh slugger and see headings in the same order, the ids
 * always agree without needing to share state between the two passes.
 */
export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  for (const rawLine of markdown.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(rawLine.trim());
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    headings.push({ id: slugger.slug(text), text, level });
  }

  return headings;
}

export function formatPostDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function estimateReadingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
