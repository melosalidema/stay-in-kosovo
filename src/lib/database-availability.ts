import net from "node:net";

let unavailableUntil = 0;
let reachableUntil = 0;
let pendingCheck: Promise<boolean> | null = null;

const reachableCacheMs = Number(process.env.DB_REACHABLE_CACHE_MS ?? 60_000);
const unavailableCacheMs = Number(process.env.DB_UNAVAILABLE_CACHE_MS ?? 10_000);

export async function isDatabaseReachable(timeoutMs = 250) {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) return false;

  const now = Date.now();
  if (unavailableUntil > now) return false;
  if (reachableUntil > now) return true;
  if (pendingCheck) return pendingCheck;

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    unavailableUntil = now + 30_000;
    return false;
  }

  const port = Number(parsed.port || 5432);
  const host = parsed.hostname;

  pendingCheck = new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (reachable: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      if (reachable) {
        reachableUntil = Date.now() + reachableCacheMs;
      } else {
        unavailableUntil = Date.now() + unavailableCacheMs;
      }
      resolve(reachable);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });

  try {
    return await pendingCheck;
  } finally {
    pendingCheck = null;
  }
}
