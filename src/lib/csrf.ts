import crypto from "node:crypto";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { fail } from "@/lib/api-response";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function getCsrfToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) return null;

  return session.user.csrfToken ?? null;
}

export async function csrfProtect(request: Request): Promise<Response | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return fail("Authentication required.", 401);
  }

  const headerToken = request.headers.get("x-csrf-token");
  const sessionToken = (session.user as Record<string, unknown>).csrfToken as string | undefined;

  if (!headerToken || !sessionToken || headerToken !== sessionToken) {
    return fail("Invalid or missing CSRF token.", 403);
  }

  return null;
}

export function withCsrf(handler: (request: Request, ...rest: unknown[]) => Promise<Response>) {
  return async (request: Request, ...rest: unknown[]): Promise<Response> => {
    const csrfError = await csrfProtect(request);
    if (csrfError) return csrfError;
    return handler(request, ...rest);
  };
}
