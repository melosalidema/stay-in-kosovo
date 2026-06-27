import Redis from "ioredis";

let redis: Redis | null = null;
let redisAvailable = false;
let lastCheck = 0;

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;

  if (!url) return null;

  if (!redis) {
    redis = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy() {
        return null;
      }
    });

    redis.on("error", () => {
      redisAvailable = false;
    });
  }

  return redis;
}

export async function isRedisAvailable(): Promise<boolean> {
  const now = Date.now();

  if (now - lastCheck < 5_000) return redisAvailable;

  lastCheck = now;
  const client = getRedis();

  if (!client) {
    redisAvailable = false;
    return false;
  }

  try {
    await client.ping();
    redisAvailable = true;
  } catch {
    redisAvailable = false;
  }

  return redisAvailable;
}

async function redisRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number } | null> {
  const client = getRedis();

  if (!client) return null;

  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const redisKey = `ratelimit:${key}:${windowKey}`;

  try {
    const result = await client
      .multi()
      .incr(redisKey)
      .ttl(redisKey)
      .exec();

    if (!result) return null;

    const count = result[0]?.[1] as number | undefined;
    const ttl = result[1]?.[1] as number | undefined;

    if (count === undefined) return null;

    if (count === 1 && (ttl === -1 || ttl === undefined)) {
      await client.expire(redisKey, Math.ceil(windowMs / 1000));
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0)
    };
  } catch {
    return null;
  }
}

export async function redisRateLimitCheck(key: string, limit = 60, windowMs = 60_000) {
  if (await isRedisAvailable()) {
    const result = await redisRateLimit(key, limit, windowMs);

    if (result) return result;
  }

  return null;
}
