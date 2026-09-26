/**
 * Job queue names, defined up front so producers (API routes / Server
 * Actions) and consumers (the standalone worker process) stay in sync.
 *
 * This has no dependency on "server-only", ioredis, or bullmq (unlike
 * lib/queue.ts, which re-exports this) — the worker process needs the
 * names but must never pull in Next.js's server-only guard, since that
 * guard throws outside Next's own bundler.
 *
 * TODO(Phase 3 — Core loop): add a worker process for "lead-search" that
 * runs the Playwright scraper (leadgen.md §4 step 3).
 * TODO(Phase 4 — Contact & Outreach): add "email-validation" and
 * "campaign-send" workers.
 * TODO(Phase 6 — Retention & upsell): add a "rank-tracker" worker.
 */
export const QUEUE_NAMES = {
  leadSearch: "lead-search",
  emailValidation: "email-validation",
  campaignSend: "campaign-send",
  rankTracker: "rank-tracker",
} as const;
