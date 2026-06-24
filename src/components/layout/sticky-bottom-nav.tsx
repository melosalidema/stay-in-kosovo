"use client";

import { CalendarDays, Compass, RadioTower, Route } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

const bottomLinks = [
  { href: "/discover", labelKey: "nav.discover", icon: Compass },
  { href: "/pulse", labelKey: "nav.pulse", icon: RadioTower },
  { href: "/itinerary", labelKey: "nav.itinerary", icon: CalendarDays },
  { href: "/mobility", labelKey: "nav.mobility", icon: Route }
];

export function StickyBottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/92 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-around">
        {bottomLinks.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{t(link.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
