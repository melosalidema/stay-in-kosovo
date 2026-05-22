import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { ChatAssistant } from "@/components/assistant/chat-assistant";
import { Footer } from "@/components/layout/footer";
import { FloatingNavbar } from "@/components/layout/floating-navbar";
import { Providers } from "@/app/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stay in Kosovo - Smart Experience & Mobility App",
  description:
    "AI-powered Kosovo discovery app for places, events, mobility, itineraries, business onboarding, and local experiences.",
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
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <FloatingNavbar />
          <main className="min-h-screen pt-20">{children}</main>
          <Footer />
          <ChatAssistant />
        </Providers>
      </body>
    </html>
  );
}
