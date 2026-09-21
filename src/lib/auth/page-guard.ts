import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";

/**
 * Page-level authorisation for Server Components.
 *
 * This used to live in middleware through next-auth's `withAuth`, which put the
 * entire NextAuth runtime into the Edge bundle. Running it here instead keeps
 * the Edge function dependency-free while the gated pages still behave: wrong
 * role, or no session at all, and the visitor is sent to the sign-in screen.
 *
 * An admin may reach any gated page. If authentication cannot be read at all —
 * a missing NEXTAUTH_SECRET, say — the page is allowed through rather than
 * throwing, because a misconfigured prototype should still be viewable. The
 * protected *data* is separate: API routes call `requireRole`, which is the
 * check that actually matters.
 */
export async function canAccessPage(...roles: UserRole[]): Promise<boolean> {
  try {
    const session = await getCurrentSession();
    const role = session?.user?.role;

    if (!role) return false;
    if (role === "ADMIN") return true;

    return roles.includes(role);
  } catch (error) {
    // Auth is unusable in this environment. Do not lock visitors out of a
    // page whose data is already protected at the API layer.
    console.warn(
      "[page-guard] could not read a session (" + (error as Error).message + "); allowing access"
    );
    return true;
  }
}

/** Redirects to sign-in unless the current session carries one of `roles`.
 *
 * Pass the path you came from so the visitor lands back where they started. */
export async function requirePageAccess(returnTo: string, ...roles: UserRole[]): Promise<void> {
  if (await canAccessPage(...roles)) return;

  redirect(`/auth/login?next=${encodeURIComponent(returnTo)}`);
}
