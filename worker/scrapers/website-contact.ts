import type { SocialLinks } from "@/lib/types/domain";

export interface WebsiteContactInfo {
  email: string | null;
  socialLinks: SocialLinks;
  hasSsl: boolean;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Addresses that show up on nearly every site's markup (image sprites,
// analytics snippets, "sentry@..." error trackers) but are never a real
// contact — filtered out rather than surfaced as a false lead email.
const EMAIL_BLOCKLIST =
  /\.(png|jpg|jpeg|gif|svg|webp)$|sentry|wixpress|example\.com|godaddy|schema\.org/i;

const SOCIAL_PATTERNS: Array<{ key: keyof SocialLinks; regex: RegExp }> = [
  { key: "facebook", regex: /https?:\/\/(www\.)?facebook\.com\/[^"'\s<>]+/i },
  { key: "instagram", regex: /https?:\/\/(www\.)?instagram\.com\/[^"'\s<>]+/i },
  { key: "linkedin", regex: /https?:\/\/(www\.)?linkedin\.com\/[^"'\s<>]+/i },
  { key: "x", regex: /https?:\/\/(www\.)?(twitter|x)\.com\/[^"'\s<>]+/i },
];

/**
 * Fetches a lead's website HTML directly (no browser) and regex-extracts
 * a contact email and social links — per-lead Playwright navigation would
 * be far too slow across a batch of 20+ leads, and a plain fetch is
 * enough for what's usually a static mailto: link or visible address in
 * the markup.
 */
export async function findWebsiteContactInfo(
  websiteUrl: string
): Promise<WebsiteContactInfo> {
  const empty: WebsiteContactInfo = {
    email: null,
    socialLinks: {},
    hasSsl: websiteUrl.startsWith("https://"),
  };

  try {
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return empty;

    const finalUrlIsHttps = response.url.startsWith("https://");
    const html = await response.text();

    const emailMatches = html.match(EMAIL_REGEX) ?? [];
    const email =
      emailMatches.find((address) => !EMAIL_BLOCKLIST.test(address)) ?? null;

    const socialLinks: SocialLinks = {};
    for (const { key, regex } of SOCIAL_PATTERNS) {
      const match = html.match(regex);
      if (match) socialLinks[key] = match[0];
    }

    return { email, socialLinks, hasSsl: finalUrlIsHttps };
  } catch {
    // Site down, timed out, blocked us — a missing website isn't fatal to
    // the search; this lead just keeps its email/social fields empty.
    return empty;
  }
}
