"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, Moon, Sun, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type NavItem = {
  href: string;
  labelKey: string;
  roles?: UserRole[];
};

const links: NavItem[] = [
  { href: "/discover", labelKey: "nav.discover" },
  { href: "/pulse", labelKey: "nav.pulse" },
  { href: "/itinerary", labelKey: "nav.itinerary" },
  { href: "/mobility", labelKey: "nav.mobility" },
  { href: "/business", labelKey: "nav.business", roles: ["BUSINESS_OWNER"] },
  { href: "/admin", labelKey: "nav.admin", roles: ["ADMIN"] }
];

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] text-primary">
        <path
          d="M2.5 18.5 9 8l3.6 5.6L15.2 10l6.3 8.5Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-serif text-[1.0625rem] leading-none tracking-[-0.01em]">Stay in Kosovo</span>
    </span>
  );
}

export function FloatingNavbar() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        frame = 0;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useFocusTrap(mobilePanelRef, open);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    window.localStorage.setItem("stay-kosovo-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const handleSignOut = () => signOut({ callbackUrl: "/auth/login" });

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[border-color,box-shadow] duration-300 ease-calm",
        "bg-[rgb(var(--glass-bg))] backdrop-blur-xl backdrop-saturate-150",
        scrolled || open ? "border-[rgb(var(--glass-border))] shadow-soft" : "border-transparent"
      )}
    >
      <nav aria-label={t("nav.menu")} className="page-shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="rounded-md transition-opacity hover:opacity-80 focus-visible:opacity-100"
          aria-label={t("app.name")}
        >
          <Wordmark />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {visibleLinks.map((link) => {
            const active = isPathActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-[0.9375rem] transition-colors duration-200",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(link.labelKey)}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-px bg-primary" aria-hidden="true" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-1.5 sm:flex">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={t("common.toggleTheme")}
            aria-pressed={dark}
          >
            {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </Button>
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={accountHref}>
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  <span className="max-w-28 truncate">{session.user?.name ?? t("common.account")}</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t("common.signOut")}
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">{t("common.signIn")}</Link>
            </Button>
          )}
        </div>

        <Button
          className="lg:hidden"
          variant="ghost"
          size="icon"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? t("nav.close") : t("nav.menu")}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={mobilePanelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.mobileMenu")}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-[rgb(var(--glass-border))] bg-[rgb(var(--glass-bg-strong))] px-4 pb-5 pt-2 backdrop-blur-xl backdrop-saturate-150 lg:hidden"
          >
            <ul className="mx-auto grid max-w-6xl">
              {visibleLinks.map((link) => {
                const active = isPathActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-12 items-center border-b border-border/60 py-3 text-base transition-colors",
                        active ? "text-primary" : "text-foreground"
                      )}
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mx-auto mt-5 flex max-w-6xl flex-wrap items-center gap-2">
              <LanguageSwitcher compact />
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                aria-label={t("common.toggleTheme")}
                aria-pressed={dark}
              >
                {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
              </Button>
              <span className="sr-only" aria-live="polite">
                {dark ? t("nav.darkModeOn") : t("nav.lightModeOn")}
              </span>
              {session ? (
                <>
                  <Button asChild className="min-w-32 flex-1">
                    <Link href={accountHref} onClick={() => setOpen(false)}>
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                      {t("common.account")}
                    </Link>
                  </Button>
                  <Button className="min-w-32 flex-1" variant="outline" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" aria-hidden="true" />
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
