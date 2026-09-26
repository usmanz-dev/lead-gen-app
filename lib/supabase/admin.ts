import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * Admin client using the service role key — bypasses Row-Level Security.
 * Deliberately has no dependency on `next/headers` or any other
 * Next.js-request-scoped API (unlike lib/supabase/server.ts's
 * createClient), since it also needs to run from the worker process
 * (worker/index.ts), which is a plain Node process outside any Next.js
 * request lifecycle.
 *
 * Server-only. Never import this from a Client Component or expose the
 * key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill in your Supabase project credentials."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
