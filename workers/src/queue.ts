import IORedis from 'ioredis';
import { Queue, Worker, type Job, type QueueOptions } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export function makeQueue<T>(name: string, opts?: Partial<QueueOptions>): Queue<T> {
  return new Queue<T>(name, { connection, ...opts });
}

export function makeWorker<T>(
  name: string,
  processor: (job: Job<T>) => Promise<void>,
  options: { concurrency?: number } = {},
) {
  return new Worker<T>(name, processor, {
    connection,
    concurrency: options.concurrency ?? 4,
    autorun: true,
  });
}

export { connection as redis };
