import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import type { UserRole } from "@/types";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireRole(roles: UserRole[]) {
  const session = await getCurrentSession();
  const role = session?.user?.role;

  if (!session?.user || !role || !roles.includes(role)) {
    return null;
  }

  return session;
}
