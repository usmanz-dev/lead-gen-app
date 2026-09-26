import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadsTable } from "@/components/dashboard/leads-table";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search: searchId } = await searchParams;

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

  let initialSearchFilter: { id: string; label: string } | null = null;
  if (searchId) {
    const { data: search } = await supabase
      .from("searches")
      .select("id, keyword, location")
      .eq("id", searchId)
      .maybeSingle();
    if (search) {
      initialSearchFilter = {
        id: search.id,
        label: `${search.keyword} — ${search.location}`,
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-muted-foreground mt-1">
          All leads collected across your searches.
        </p>
      </div>

      <LeadsTable initialSearchFilter={initialSearchFilter} />
    </div>
  );
}
