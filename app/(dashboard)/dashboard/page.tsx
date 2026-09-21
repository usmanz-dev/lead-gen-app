import type { Metadata } from "next";
import { Search, Send, Gauge } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

const UPCOMING_STATS = [
  {
    icon: Search,
    label: "Leads found",
    note: "Wires up once the Lead Search + scraping engine ships (Phase 3).",
  },
  {
    icon: Gauge,
    label: "Avg. Opportunity Score",
    note: "Wires up once lead scoring ships (Phase 3).",
  },
  {
    icon: Send,
    label: "Emails sent",
    note: "Wires up once the Bulk Sending Engine ships (Phase 4).",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s where your lead-gen pipeline will live once search and
          outreach are wired up.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {UPCOMING_STATS.map(({ icon: Icon, label, note }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {label}
              </CardTitle>
              <Icon
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground/40 text-2xl font-semibold">
                —
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Run your first lead search</CardTitle>
            <Badge variant="outline">Coming soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground max-w-2xl text-sm">
            The New Lead Search page — where you&apos;ll search a niche and
            location, run the Google Maps scraper, and see each business&apos;s
            Opportunity Score — is built in the next phase (Phase 3: Core loop,
            per the product build order). This dashboard shell, navigation, and
            your account are already fully wired to real authentication.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
