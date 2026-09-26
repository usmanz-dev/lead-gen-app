import { chromium, type Browser, type Page } from "playwright";

export interface ScrapedLead {
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  /** Raw hours status text as Google renders it, e.g. "Open 24 hours" or
   * "Closed · Opens 10 AM Thu" — null when the card shows no hours line
   * at all (a real signal, not a parsing gap). */
  hoursStatus: string | null;
  rating: number | null;
  reviewCount: number;
  websiteUrl: string | null;
  googleMapsUrl: string;
}

export interface ScrapeFilters {
  minRating?: number;
  minReviewCount?: number;
  hasWebsite?: boolean;
  noWebsiteOnly?: boolean;
}

export interface ScrapeOptions {
  keyword: string;
  location: string;
  filters?: ScrapeFilters;
  /** Stop once this many *matching* (post-filter) leads have been found. */
  maxResults?: number;
  onProgress?: (found: number) => void | Promise<void>;
}

const FEED_SELECTOR = 'div[role="feed"]';
const ARTICLE_SELECTOR = '[role="article"]';
const RESULT_LINK_SELECTOR = 'a[href*="/maps/place/"]';
const SCROLL_STEP_PX = 1600;
const SCROLL_PAUSE_MS = 1200;
const MAX_SCROLL_ATTEMPTS = 40;
const NAV_TIMEOUT_MS = 30_000;

/**
 * Scrapes Google Maps search results via Playwright — the free
 * alternative to the paid Places API (leadgen.md §8). Scrolls the results
 * feed to load listings, then extracts each card's fields using Google's
 * `role="article"`/`role="img"` ARIA structure rather than its generated
 * class names, which are far more volatile. Selectors and the field-
 * parsing regexes below were validated against live results, not guessed
 * — see the field-parsing note above parseCardFields for what's reliable
 * (category, rating, reviews, phone) vs. best-effort (address, which
 * Google renders with no delimiter between it and the hours status text).
 */
export async function scrapeGoogleMaps(
  options: ScrapeOptions
): Promise<ScrapedLead[]> {
  const {
    keyword,
    location,
    filters = {},
    maxResults = 60,
    onProgress,
  } = options;

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 900 },
      locale: "en-US",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(NAV_TIMEOUT_MS);

    const query = `${keyword} in ${location}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

    await dismissConsentIfPresent(page);

    const feedAppeared = await page
      .waitForSelector(FEED_SELECTOR, { timeout: NAV_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);

    if (!feedAppeared) {
      // A real "no results for this query" page has no feed at all —
      // this is a legitimate zero-results outcome, not a scraper failure.
      return [];
    }

    // Let the feed's initial content settle before the first read.
    // extractVisibleCards has its own fallback for the (fairly common)
    // case where a card's rating aria-label finishes rendering the star
    // score before the review count.
    await page.waitForTimeout(2000);

    const seenUrls = new Set<string>();
    const results: ScrapedLead[] = [];
    let stagnantScrolls = 0;
    let previousCount = 0;

    for (let attempt = 0; attempt < MAX_SCROLL_ATTEMPTS; attempt++) {
      const cards = await extractVisibleCards(page);

      for (const card of cards) {
        if (seenUrls.has(card.googleMapsUrl)) continue;
        seenUrls.add(card.googleMapsUrl);

        if (!passesFilters(card, filters)) continue;

        results.push(card);
        if (onProgress) await onProgress(results.length);

        if (results.length >= maxResults) break;
      }

      if (results.length >= maxResults) break;

      if (results.length === previousCount) {
        stagnantScrolls++;
        // Google renders an end-of-list marker; three stagnant scrolls in
        // a row is the practical signal nothing new is left to load.
        if (stagnantScrolls >= 3) break;
      } else {
        stagnantScrolls = 0;
      }
      previousCount = results.length;

      await page.evaluate(
        ({ selector, step }) => {
          const feed = document.querySelector(selector);
          feed?.scrollBy(0, step);
        },
        { selector: FEED_SELECTOR, step: SCROLL_STEP_PX }
      );
      await page.waitForTimeout(SCROLL_PAUSE_MS);
    }

    return results;
  } finally {
    await browser?.close();
  }
}

async function dismissConsentIfPresent(page: Page) {
  try {
    const consentButton = page.getByRole("button", {
      name: /accept all|i agree|reject all/i,
    });
    if (await consentButton.first().isVisible({ timeout: 3000 })) {
      await consentButton.first().click();
    }
  } catch {
    // No consent dialog shown — nothing to dismiss.
  }
}

async function extractVisibleCards(page: Page): Promise<ScrapedLead[]> {
  const rawCards = await page.evaluate(
    ({ feedSelector, articleSelector, linkSelector }) => {
      const feed = document.querySelector(feedSelector);
      if (!feed) return [];

      const articles = Array.from(feed.querySelectorAll(articleSelector));

      return articles
        .map((article) => {
          const link = article.querySelector(
            linkSelector
          ) as HTMLAnchorElement | null;
          if (!link) return null;

          const name = link.getAttribute("aria-label")?.trim();
          const googleMapsUrl = link.href;
          if (!name || !googleMapsUrl) return null;

          const isSponsored =
            article.textContent?.includes("Sponsored") ?? false;

          const ratingEl = article.querySelector('span[role="img"]');
          let ratingLabel = ratingEl?.getAttribute("aria-label") ?? null;
          // The aria-label sometimes finishes rendering with the star
          // score but without the review count yet ("4.9 stars", no
          // "Reviews" suffix) — confirmed by direct measurement to be a
          // real render-timing race, not a fixed delay away. When that
          // happens, read the two child spans Google renders the same
          // numbers into directly instead of re-waiting on the label.
          if (ratingLabel && !/review/i.test(ratingLabel)) {
            const scoreText = ratingEl?.querySelector(".MW4etd")?.textContent;
            const countText = ratingEl
              ?.querySelector(".UY7F9")
              ?.textContent?.replace(/[()]/g, "");
            if (scoreText && countText) {
              ratingLabel = `${scoreText} stars ${countText} Reviews`;
            }
          }

          const infoBlock = article.querySelector(".UaQhfb, .fontBodyMedium");
          let restText = "";
          if (infoBlock) {
            const clone = infoBlock.cloneNode(true) as HTMLElement;
            clone.querySelector('span[role="img"]')?.remove();
            clone.querySelector(".qBF1Pd, .fontHeadlineSmall")?.remove();
            restText = clone.textContent ?? "";
          }

          const websiteLink = article.querySelector(
            'a[data-value="Website"], a[aria-label^="Website"]'
          ) as HTMLAnchorElement | null;

          return {
            name,
            googleMapsUrl,
            isSponsored,
            ratingLabel,
            restText,
            websiteUrl: websiteLink?.href ?? null,
          };
        })
        .filter((card): card is NonNullable<typeof card> => card !== null);
    },
    {
      feedSelector: FEED_SELECTOR,
      articleSelector: ARTICLE_SELECTOR,
      linkSelector: RESULT_LINK_SELECTOR,
    }
  );

  return rawCards
    .filter((card) => !card.isSponsored)
    .map((card) => {
      const fields = parseCardFields(card.restText, card.ratingLabel);
      return {
        name: card.name,
        googleMapsUrl: card.googleMapsUrl,
        websiteUrl: card.websiteUrl,
        ...fields,
      };
    });
}

// Matches the hours-status phrase Google glues directly onto the end of
// the address with no delimiter (e.g. "...Taj ClinicsCloses soon").
const HOURS_STATUS_PATTERN = /(Opens?\b|Opened\b|Closed\b|Closes soon\b).*/;

/**
 * Google concatenates a result card's category, address, hours status,
 * and phone into one text block with "·" separators and *no* separator
 * at all between the address and the hours status that follows it. The
 * split below was validated against real captured cards:
 *   - category: reliable — everything before the first "·"
 *   - rating/reviewCount: reliable — parsed from the ARIA rating label,
 *     not the visible text
 *   - phone: reliable — the trailing phone-shaped token
 *   - hoursStatus: reliable — the status phrase matched via
 *     HOURS_STATUS_PATTERN; null (not "unknown") when the card genuinely
 *     shows no hours line
 *   - address: best-effort — the middle segment with the hours-status
 *     phrase stripped off, since that's glued on with no delimiter
 */
function parseCardFields(
  restText: string,
  ratingLabel: string | null
): Pick<
  ScrapedLead,
  "rating" | "reviewCount" | "category" | "phone" | "address" | "hoursStatus"
> {
  const ratingMatch = ratingLabel?.match(
    /^([\d.]+)\s*stars?\s*([\d,]+)\s*Review/i
  );
  const rating = ratingMatch ? Number(ratingMatch[1]) : null;
  const reviewCount = ratingMatch
    ? Number(ratingMatch[2].replace(/,/g, ""))
    : 0;

  const firstDotIndex = restText.indexOf("·");
  const category =
    firstDotIndex > -1
      ? restText.slice(0, firstDotIndex).trim() || null
      : restText.trim() || null;

  const phoneMatch = restText.match(/(\+?\d[\d\s]{7,}\d)\s*$/);
  const phone = phoneMatch ? phoneMatch[1].trim() : null;

  let middle =
    firstDotIndex > -1
      ? restText.slice(
          firstDotIndex + 1,
          phoneMatch ? restText.length - phoneMatch[0].length : undefined
        )
      : "";
  middle = middle.replace(/·/g, " ").replace(/\s+/g, " ").trim();

  const hoursMatch = middle.match(HOURS_STATUS_PATTERN);
  const hoursStatus = hoursMatch
    ? hoursMatch[0].replace(/\s+/g, " ").trim()
    : null;

  const address =
    middle.split(HOURS_STATUS_PATTERN)[0].replace(/\s+/g, " ").trim() || null;

  return { rating, reviewCount, category, phone, address, hoursStatus };
}

function passesFilters(lead: ScrapedLead, filters: ScrapeFilters): boolean {
  if (filters.minRating !== undefined) {
    if (lead.rating === null || lead.rating < filters.minRating) return false;
  }
  if (filters.minReviewCount !== undefined) {
    if (lead.reviewCount < filters.minReviewCount) return false;
  }
  if (filters.hasWebsite && !lead.websiteUrl) return false;
  if (filters.noWebsiteOnly && lead.websiteUrl) return false;
  return true;
}
