import { redisRateLimitCheck } from "@/lib/rate-limit-redis";

type Bucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKET_KEYS = 10_000;
let cleanupCounter = 0;

export function getClientKey(request: Request, namespace: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  let ip: string;

  if (forwardedFor && (process.env.TRUSTED_PROXY === "true" || process.env.NODE_ENV === "production")) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    ip = parts[0] ?? "unknown";
  } else if (realIp && (process.env.TRUSTED_PROXY === "true" || process.env.NODE_ENV === "production")) {
    ip = realIp;
  } else {
    ip = "local";
  }

  return `${namespace}:${ip}`;
}

function inMemoryRateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();

  cleanupCounter += 1;
  if (cleanupCounter % 250 === 0) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.expiresAt < now) buckets.delete(bucketKey);
    }
  }

  if (buckets.size >= MAX_BUCKET_KEYS) {
    return { allowed: true, remaining: limit };
  }

  const current = buckets.get(key);

  if (!current || current.expiresAt < now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: current.count <= limit,
    remaining: Math.max(limit - current.count, 0)
  };
}

export async function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  if (process.env.REDIS_URL) {
    const redisResult = await redisRateLimitCheck(key, limit, windowMs);

    if (redisResult) return redisResult;
  }

  return inMemoryRateLimit(key, limit, windowMs);
}
