/**
 * "Remember me" for Supabase Auth sessions.
 *
 * @supabase/ssr (0.12.x) always writes its auth cookies with its own
 * 400-day maxAge — any `cookieOptions.maxAge` passed to createBrowserClient
 * is overwritten on every write (see its cookies.js: `maxAge:
 * DEFAULT_COOKIE_OPTIONS.maxAge` is spread in *after* the caller's
 * options). And creating the client with `auth.persistSession: false`
 * isn't a substitute — this app's middleware and server components read
 * the session from cookies, so a session that's never written to a cookie
 * would fail every server-side check immediately after a client-side
 * login.
 *
 * So "don't remember me" is implemented by letting Supabase write its
 * normal (non-httpOnly, by its own DEFAULT_COOKIE_OPTIONS) cookies, then
 * immediately rewriting them as session cookies (no max-age/expires) —
 * the browser drops those when it closes, while the current tab keeps
 * working normally since the cookie is still present right now.
 */

function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  const match = /^https?:\/\/([^.]+)\.supabase\.co/.exec(url);
  return match?.[1] ?? null;
}

function parseDocumentCookies(): Map<string, string> {
  return new Map(
    document.cookie
      .split("; ")
      .filter(Boolean)
      .map((pair) => {
        const eq = pair.indexOf("=");
        return [pair.slice(0, eq), pair.slice(eq + 1)];
      })
  );
}

/**
 * Rewrites this browser's Supabase auth cookie(s) as session cookies, so
 * the session ends when the browser closes instead of persisting for
 * Supabase's default ~400 days. Call right after a successful sign-in when
 * the user did not check "Remember me".
 */
export function forgetSessionOnBrowserClose(): void {
  const projectRef = getProjectRef();
  if (!projectRef || typeof document === "undefined") return;

  const prefix = `sb-${projectRef}-auth-token`;
  const cookies = parseDocumentCookies();
  const secure = window.location.protocol === "https:" ? "; secure" : "";

  cookies.forEach((value, name) => {
    if (name === prefix || name.startsWith(`${prefix}.`)) {
      document.cookie = `${name}=${value}; path=/; samesite=lax${secure}`;
    }
  });
}
