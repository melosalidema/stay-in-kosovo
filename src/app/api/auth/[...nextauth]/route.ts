import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { fail } from "@/lib/api-response";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

const CREDENTIAL_LOGIN_LIMIT = Number(process.env.AUTH_LOGIN_LIMIT ?? 10);
const CREDENTIAL_LOGIN_WINDOW_MS = Number(process.env.AUTH_LOGIN_WINDOW_MS ?? 60_000);

async function rateLimitedHandler(req: Request) {
  const url = new URL(req.url);

  if (
    req.method === "POST" &&
    url.pathname.endsWith("/api/auth/callback/credentials")
  ) {
    const limited = await rateLimit(getClientKey(req, "auth-credentials"), CREDENTIAL_LOGIN_LIMIT, CREDENTIAL_LOGIN_WINDOW_MS);

    if (!limited.allowed) {
      return fail("Too many login attempts. Please wait a moment.", 429);
    }
  }

  return handler(req, undefined);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };