import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://images.unsplash.com https://source.unsplash.com https://res.cloudinary.com https://upload.wikimedia.org https://static.wixstatic.com https://images.weserv.nl https://media.4-paws.org https://dynamic-media-cdn.tripadvisor.com`,
    `font-src 'self'`,
    `connect-src 'self' https://api.open-meteo.com https://res.cloudinary.com https://api.cloudinary.com`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`
  ].join("; ");
}

export default withAuth(
  function middleware(request) {
    const nonce = generateNonce();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", buildCsp(nonce));
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
    response.headers.set("X-Frame-Options", "DENY");

    const role = request.nextauth.token?.role;
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    if (pathname.startsWith("/business")) {
      if (role !== "BUSINESS_OWNER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/auth/login?next=/business", request.url));
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname;
        const protectedPath =
          pathname.startsWith("/admin") ||
          pathname.startsWith("/business") ||
          pathname.startsWith("/api/admin");

        return protectedPath ? Boolean(token) : true;
      }
    }
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)"]
};
