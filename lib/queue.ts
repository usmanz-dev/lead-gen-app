import "server-only";
import { Redis } from "ioredis";
import { Queue, type QueueOptions } from "bullmq";
import { QUEUE_NAMES } from "@/lib/queue-names";

export { QUEUE_NAMES };

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
