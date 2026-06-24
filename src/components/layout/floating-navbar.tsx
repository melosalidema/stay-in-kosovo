"use client";

import { CalendarDays, Compass, LayoutDashboard, LogOut, Map, Menu, Moon, Route, Sparkles, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ComponentType, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type NavItem = {
  href: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  roles?: UserRole[];
};

const links: NavItem[] = [
  { href: "/pulse", labelKey: "nav.pulse", icon: Sparkles },
  { href: "/discover", labelKey: "nav.discover", icon: Compass },
  { href: "/itinerary", labelKey: "nav.itinerary", icon: CalendarDays },
  { href: "/mobility", labelKey: "nav.mobility", icon: Route },
  { href: "/business", labelKey: "nav.business", icon: LayoutDashboard, roles: ["BUSINESS_OWNER"] },
  { href: "/admin", labelKey: "nav.admin", icon: Map, roles: ["ADMIN"] }
];

export function FloatingNavbar() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const role = session?.user?.role;

  const visibleLinks = useMemo(
    () => links.filter((link) => !link.roles || (role ? link.roles.includes(role) : false)),
    [role]
  );

  const accountHref = role === "ADMIN" ? "/admin" : role === "BUSINESS_OWNER" ? "/business" : "/";

  useEffect(() => {
    const stored = window.localStorage.getItem("stay-kosovo-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = stored ? stored === "dark" : prefersDark;
    setDark(shouldDark);
    document.documentElement.classList.toggle("dark", shouldDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    window.localStorage.setItem("stay-kosovo-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const handleSignOut = () => signOut({ callbackUrl: "/auth/login" });

  return (
    <header className="fixed left-0 right-0 top-3 z-40 px-3">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-lg border border-white/20 bg-white/82 px-3 py-2 shadow-glass backdrop-blur-2xl dark:bg-slate-950/76">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Map className="h-5 w-5" />
          </span>
          <span className="truncate text-sm font-bold sm:text-base">{t("app.name")}</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {t(link.labelKey)}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("common.toggleTheme")}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {session ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={accountHref}>
                  <UserRound className="h-4 w-4" />
                  {session.user?.name ?? t("common.account")}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                {t("common.signOut")}
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">
                <UserRound className="h-4 w-4" />
                {t("common.signIn")}
              </Link>
            </Button>
          )}
        </div>

        <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setOpen((value) => !value)} aria-label={t("nav.menu")}>
          <Menu className="h-5 w-5" />
        </Button>
      </nav>

      <div
        className={cn(
          "mx-auto mt-2 grid max-w-7xl gap-2 rounded-lg border border-border bg-background/95 p-2 shadow-glass backdrop-blur-xl lg:hidden",
          open ? "block" : "hidden"
        )}
      >
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <link.icon className="h-4 w-4" />
            {t(link.labelKey)}
          </Link>
        ))}
        <div className="flex flex-wrap gap-2 border-t border-border pt-2">
          <LanguageSwitcher compact />
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={t("common.toggleTheme")}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {session ? (
            <>
              <Button asChild className="min-w-32 flex-1">
                <Link href={accountHref} onClick={() => setOpen(false)}>
                  <UserRound className="h-4 w-4" />
                  {t("common.account")}
                </Link>
              </Button>
              <Button className="min-w-32 flex-1" variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                {t("common.signOut")}
              </Button>
            </>
          ) : (
            <Button asChild className="flex-1">
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                {t("common.signIn")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
