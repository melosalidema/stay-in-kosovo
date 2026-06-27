import type { Session } from "next-auth";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import type { UserRole } from "@/types";
import { fail } from "@/lib/api-response";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireRole(roles: UserRole[], failureMessage = "You do not have permission to access this resource."): Promise<Session | Response> {
  const session = await getCurrentSession();
  const role = session?.user?.role;

  if (!session?.user || !role || !roles.includes(role)) {
    return fail(failureMessage, 403);
  }

  return session;
}
