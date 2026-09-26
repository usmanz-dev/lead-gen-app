import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSearchHistory } from "@/lib/searches";
import { SearchForm } from "@/components/dashboard/search-form";
import { SearchHistoryList } from "@/components/dashboard/search-history-list";

export const metadata: Metadata = { title: "New Lead Search" };
export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

  const history = await getSearchHistory(membership.organization_id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Lead Search
        </h1>
        <p className="text-muted-foreground mt-1">
          Scrape Google Maps for local businesses matching your criteria.
        </p>
      </div>

      <SearchForm />

      <SearchHistoryList items={history} />
    </div>
  );
}
