import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppTopbar } from "@/components/dashboard/app-topbar";

// Every dashboard page depends on the signed-in user's session — never
// prerender this subtree at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          userEmail={user.email ?? ""}
          userName={
            (user.user_metadata?.full_name as string | undefined) ?? null
          }
        />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
