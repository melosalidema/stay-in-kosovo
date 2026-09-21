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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg sm:hidden"
    >
      <ul className="flex items-stretch">
        {bottomLinks.map((link) => {
          const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <link.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                <span className="truncate">{t(link.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
