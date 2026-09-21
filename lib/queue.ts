import "server-only";
import { Redis } from "ioredis";
import { Queue, type QueueOptions } from "bullmq";

let redisConnection: Redis | null = null;

function getRedisConnection(): Redis {
  if (redisConnection) return redisConnection;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set. Add it to your .env.local file.");
  }

  redisConnection = new Redis(url, { maxRetriesPerRequest: null });
  return redisConnection;
}

const queueOptions: QueueOptions = {
  get connection() {
    return getRedisConnection();
  },
};

/**
 * Job queue names, defined up front so producers (API routes) and
 * consumers (worker processes) stay in sync.
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

const queues = new Map<string, Queue>();

export function getQueue(
  name: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]
): Queue {
  const existing = queues.get(name);
  if (existing) return existing;

  const queue = new Queue(name, queueOptions);
  queues.set(name, queue);
  return queue;
}
