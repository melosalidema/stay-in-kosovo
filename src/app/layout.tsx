import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import "./globals.css";
import { ChatAssistant } from "@/components/assistant/chat-assistant";
import { Footer } from "@/components/layout/footer";
import { FloatingNavbar } from "@/components/layout/floating-navbar";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { Providers } from "@/app/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap"
});

/**
 * The middleware issues a per-request CSP nonce and Next.js stamps it onto its
 * own inline bootstrap scripts. A statically prerendered page is generated at
 * build time, when there is no request and therefore no nonce — so its scripts
 * ship without one, the CSP blocks them, and the page renders but never
 * hydrates. Rendering every route per request is what makes the nonce possible.
 *
 * Applied here rather than per-page so a new page cannot silently reintroduce
 * the bug. Verified by src/__tests__/csp-map-tiles.test.ts and the browser check.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stay in Kosovo - Places, plans and local favourites",
  description:
    "Discover Kosovo through local favourites, mood-led recommendations, day plans and simple transport between the places worth your time.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "64x64" }
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <Providers>
          <ScrollProgress />
          <FloatingNavbar />
          <main className="min-h-screen pt-20 pb-24 sm:pb-0">{children}</main>
          <Footer />
          <ChatAssistant />
          <ScrollToTop />
          <MobileActionBar />
        </Providers>
      </body>
    </html>
  );
}
