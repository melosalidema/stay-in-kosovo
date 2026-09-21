import { NextResponse, type NextRequest } from "next/server";

import { buildCsp } from "@/lib/csp";

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Security headers only.
 *
 * This middleware used to wrap next-auth's `withAuth`, which forced the whole
 * NextAuth runtime into the Edge bundle. Netlify executes middleware in an Edge
 * function rather than Node, and that bundle is the most fragile part of the
 * deploy — it took the entire site down with "a problem with the server
 * configuration" before anyone could reach the homepage.
 *
 * Role checks no longer happen here. Authorisation now lives in two places:
 * - API routes, via `requireRole`, which is where the protected data is read.
 * - Server Components, via `canAccessPage`, so the gated pages still redirect.
 *
 * Both run in the Node runtime, where NextAuth actually works.
 */
export default function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads the nonce out of the *request* Content-Security-Policy header
  // and stamps it onto its own script tags. Setting it only on the response
  // leaves every inline bootstrap script without a nonce: the page renders but
  // never hydrates.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)"]
};
