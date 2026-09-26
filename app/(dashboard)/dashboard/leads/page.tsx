import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Search as SearchIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

function scoreBadgeVariant(score: number): "success" | "warning" | "secondary" {
  if (score >= 60) return "success";
  if (score >= 30) return "warning";
  return "secondary";
}

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

  let query = supabase
    .from("leads")
    .select(
      "id, name, category, rating, review_count, website_url, email, phone, opportunity_score, status"
    )
    .eq("organization_id", membership.organization_id)
    .order("opportunity_score", { ascending: false, nullsFirst: false });

  let searchLabel: { keyword: string; location: string } | null = null;
  if (searchId) {
    query = query.eq("search_id", searchId);
    const { data: search } = await supabase
      .from("searches")
      .select("keyword, location")
      .eq("id", searchId)
      .maybeSingle();
    if (search) searchLabel = search;
  }

  const { data: leads } = await query.limit(200);
  const rows = leads ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">
            {searchLabel
              ? `Results for "${searchLabel.keyword}" in ${searchLabel.location}`
              : "All leads collected across your searches."}
          </p>
        </div>
        {searchLabel && (
          <Button variant="outline" render={<Link href="/dashboard/leads" />}>
            <X className="size-4" aria-hidden="true" />
            Clear filter
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <SearchIcon
              className="text-muted-foreground mb-3 size-8"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold">No leads yet</h2>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              {searchLabel
                ? "This search hasn't produced any leads."
                : "Run a lead search to start building your pipeline."}
            </p>
            <Button className="mt-6" render={<Link href="/dashboard/search" />}>
              New Lead Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium whitespace-normal">
                      {lead.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.category ?? "—"}
                    </TableCell>
                    <TableCell>
                      {lead.rating !== null
                        ? `${lead.rating.toFixed(1)} (${lead.review_count})`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {lead.website_url ? (
                        <a
                          href={lead.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-1 hover:underline"
                        >
                          <Globe className="size-3.5" aria-hidden="true" />
                          Visit
                        </a>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.email ?? lead.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      {lead.opportunity_score !== null ? (
                        <Badge
                          variant={scoreBadgeVariant(lead.opportunity_score)}
                        >
                          {lead.opportunity_score}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {lead.status}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
