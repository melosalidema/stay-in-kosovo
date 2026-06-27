"use client";

import { CalendarDays, Compass, Home, Route } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

const bottomLinks = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/discover", labelKey: "nav.discover", icon: Compass },
  { href: "/itinerary", labelKey: "nav.itinerary", icon: CalendarDays },
  { href: "/mobility", labelKey: "nav.mobility", icon: Route }
];

export function MobileActionBar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("nav.primaryActions")}
      className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-xs items-center justify-around rounded-full border border-border bg-card/92 p-1 shadow-glass backdrop-blur-xl sm:hidden"
    >
      {bottomLinks.map((link) => {
        const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <link.icon className="h-4 w-4" aria-hidden="true" />
            <span>{t(link.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}