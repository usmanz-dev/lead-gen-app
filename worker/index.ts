/**
 * Entry point for the background worker process — run separately from the
 * Next.js app (per leadgen.md §8: Vercel for the app, Railway/Render for
 * this). Start locally with `npm run worker`.
 *
 * This process needs its own env vars loaded (Next.js's automatic
 * .env.local loading only applies to `next dev`/`next build`), hence the
 * explicit dotenv call before anything else runs.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { QUEUE_NAMES } from "@/lib/queue-names";
import { processLeadSearchJob } from "@/worker/processors/lead-search";
import type { LeadSearchJobData } from "@/lib/jobs/lead-search";

function getRedisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "REDIS_URL is not set. Add your Redis connection string to .env.local before starting the worker."
    );
  }
  return url;
}

const connection = new Redis(getRedisUrl(), { maxRetriesPerRequest: null });

const leadSearchWorker = new Worker<LeadSearchJobData>(
  QUEUE_NAMES.leadSearch,
  async (job: Job<LeadSearchJobData>) => {
    console.log(
      `[lead-search] starting job ${job.id} — "${job.data.keyword}" in "${job.data.location}"`
    );
    await processLeadSearchJob(job.data);
    console.log(`[lead-search] finished job ${job.id}`);
  },
  { connection, concurrency: 2 }
);

leadSearchWorker.on("failed", (job, error) => {
  console.error(`[lead-search] job ${job?.id} failed:`, error.message);
});

console.log("Worker started. Listening for jobs on:", QUEUE_NAMES.leadSearch);

process.on("SIGTERM", async () => {
  await leadSearchWorker.close();
  process.exit(0);
});
