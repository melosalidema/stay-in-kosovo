import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
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

    return NextResponse.next();
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
  matcher: ["/admin/:path*", "/business/:path*", "/api/admin/:path*"]
};
