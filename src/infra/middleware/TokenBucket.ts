import { FastifyRequest, FastifyReply } from "fastify";

interface Bucket {
  capacity: number;
  tokens: number;
  lastChecked: number;
}

const buckets = new Map<string, Bucket>();

const CAPACITY = 5;
const REFILL_RATE = 10000;

setInterval(() => {
  for (const [_userId, bucket] of buckets) {
    if (bucket.tokens < CAPACITY) {
      console.log(bucket, "Refilling token for bucket");
      bucket.tokens = bucket.tokens + 1;
    }
  }
  console.log(buckets, "Buckets after refill");
}, REFILL_RATE);

export async function rateLimiter(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.headers["x-user-id"] as string | undefined;

  if (!userId) {
    return reply.status(400).send({ error: "x-user-id header required" });
  }

  let bucket = buckets.get(userId);

  if (!bucket) {
    bucket = { capacity: CAPACITY, tokens: CAPACITY, lastChecked: Date.now() };
    buckets.set(userId, bucket);
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return;
  }

  return reply.status(429).send({ error: "Too Many Requests" });
}
