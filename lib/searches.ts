import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SearchStatus } from "@/lib/types/database.types";

export interface SearchHistoryItem {
  id: string;
  keyword: string;
  location: string;
  status: SearchStatus;
  leadsFound: number;
  errorMessage: string | null;
  createdAt: string;
}

export async function getSearchHistory(
  organizationId: string,
  limit = 20
): Promise<SearchHistoryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("searches")
    .select(
      "id, keyword, location, status, leads_found, error_message, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    keyword: row.keyword,
    location: row.location,
    status: row.status,
    leadsFound: row.leads_found,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }));
}
