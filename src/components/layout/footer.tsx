"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/layout/language-switcher";

const quickLinks = [
  { href: "/discover", labelKey: "nav.discover" },
  { href: "/pulse", labelKey: "nav.pulse" },
  { href: "/itinerary", labelKey: "nav.itinerary" },
  { href: "/mobility", labelKey: "nav.mobility" }
];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 border-t border-border bg-secondary/40">
      <div className="page-shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="font-serif text-lg leading-none tracking-[-0.01em]">{t("app.name")}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{t("footer.description")}</p>
        </div>

        <nav aria-label={t("footer.explore")} className="text-sm">
          <p className="font-medium text-foreground">{t("footer.explore")}</p>
          <ul className="mt-3 space-y-2.5">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm">
          <p className="font-medium text-foreground">{t("footer.language")}</p>
          <div className="mt-3">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="page-shell border-t border-border py-6">
        <p className="text-xs font-medium text-foreground">{t("footer.creditsTitle")}</p>
        <p className="mt-1.5 max-w-3xl text-xs leading-5 text-muted-foreground">{t("footer.creditsText")}</p>
      </div>

      <div className="page-shell flex flex-col gap-2 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} {t("app.name")}. {t("footer.rights")}
        </p>
        <p>{t("footer.madeIn")}</p>
      </div>
    </footer>
  );
}
