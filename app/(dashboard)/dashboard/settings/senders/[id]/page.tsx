import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSenderDetail } from "@/app/(dashboard)/dashboard/settings/senders/actions";
import { SenderDetailView } from "@/components/dashboard/senders/sender-detail-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sender = await getSenderDetail(id);
  return { title: sender?.emailAddress ?? "Sender" };
}

export default async function SenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const sender = await getSenderDetail(id);
  if (!sender) notFound();

  return <SenderDetailView initialSender={sender} />;
}
