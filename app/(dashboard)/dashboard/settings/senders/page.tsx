import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listSendersDetailed } from "@/app/(dashboard)/dashboard/settings/senders/actions";
import { SendersList } from "@/components/dashboard/senders/senders-list";

export const metadata: Metadata = { title: "Sender Settings" };
export const dynamic = "force-dynamic";

export default async function SendersPage() {
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

  const senders = await listSendersDetailed();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sender Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage the mailboxes your campaigns send from.
        </p>
      </div>

      <SendersList
        organizationId={membership.organization_id}
        initialSenders={senders}
      />
    </div>
  );
}
