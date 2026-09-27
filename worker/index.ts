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

import { Worker, Queue, type Job } from "bullmq";
import { Redis } from "ioredis";
import { QUEUE_NAMES } from "@/lib/queue-names";
import { processLeadSearchJob } from "@/worker/processors/lead-search";
import { processCampaignSendJob } from "@/worker/processors/campaign-send";
import type { LeadSearchJobData } from "@/lib/jobs/lead-search";
import type { CampaignSendJobData } from "@/lib/jobs/campaign-send";

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

// Passed into the processor so it can re-delay a job to tomorrow when the
// sender's daily limit is already hit at send time (see
// worker/processors/campaign-send.ts).
const campaignSendQueue = new Queue<CampaignSendJobData>(
  QUEUE_NAMES.campaignSend,
  {
    connection,
  }
);

const campaignSendWorker = new Worker<CampaignSendJobData>(
  QUEUE_NAMES.campaignSend,
  async (job: Job<CampaignSendJobData>) => {
    await processCampaignSendJob(job.data, campaignSendQueue);
  },
  { connection, concurrency: 3 }
);

campaignSendWorker.on("failed", (job, error) => {
  console.error(`[campaign-send] job ${job?.id} failed:`, error.message);
});

console.log(
  "Worker started. Listening for jobs on:",
  QUEUE_NAMES.leadSearch,
  "and",
  QUEUE_NAMES.campaignSend
);

process.on("SIGTERM", async () => {
  await leadSearchWorker.close();
  await campaignSendWorker.close();
  await campaignSendQueue.close();
  process.exit(0);
});
