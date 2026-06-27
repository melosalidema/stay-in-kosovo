"use client";

import { CalendarDays, Compass, Globe, Map, Route, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const quickLinks = [
  { href: "/discover", labelKey: "nav.discover", icon: Compass },
  { href: "/pulse", labelKey: "nav.pulse", icon: Sparkles },
  { href: "/itinerary", labelKey: "nav.itinerary", icon: CalendarDays },
  { href: "/mobility", labelKey: "nav.mobility", icon: Route }
];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="section-band border-t border-border bg-muted/40">
      <div className="page-shell grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Map className="h-4 w-4" />
            </span>
            {t("app.name")}
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            {t("footer.description")}
          </p>
          <div className="mt-4 flex items-center gap-3 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="text-xs">Kosovo</span>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold">{t("nav.discover")}</p>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("footer.aiTitle")}
          </p>
          <p className="leading-6 text-muted-foreground">{t("footer.aiText")}</p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t("footer.productionTitle")}
          </p>
          <p className="leading-6 text-muted-foreground">{t("footer.productionText")}</p>
        </div>
      </div>
      <div className="page-shell mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} {t("app.name")}. All rights reserved.
      </div>
    </footer>
  );
}
