type Bucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, Bucket>();
let cleanupCounter = 0;

export function getClientKey(request: Request, namespace: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  return `${namespace}:${forwardedFor ?? realIp ?? "local"}`;
}

export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();

  cleanupCounter += 1;
  if (cleanupCounter % 250 === 0) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.expiresAt < now) buckets.delete(bucketKey);
    }
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
