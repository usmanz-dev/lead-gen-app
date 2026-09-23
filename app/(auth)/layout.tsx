import Link from "next/link";
import { Radar } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="from-primary/10 via-background to-secondary/50 flex min-h-screen flex-col items-center justify-center bg-linear-to-br px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <Radar className="text-primary size-5" aria-hidden="true" />
        <span>LocalLeads AI</span>
      </Link>
      <div className="border-border bg-card w-[92%] max-w-105 rounded-xl border p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
