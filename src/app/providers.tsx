"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useOfflineSync } from "@/hooks/use-offline-sync";
import { AppI18nProvider } from "@/i18n/i18n-provider";

function OfflineBanner() {
  const { online } = useOfflineSync();
  const { t } = useTranslation();

  if (online) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-md border border-amber-300/40 bg-amber-100 px-4 py-3 text-sm text-amber-900 shadow-lg sm:bottom-3 dark:bg-amber-950 dark:text-amber-100">
      {t("offline.message")}
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppI18nProvider>
        {children}
        <OfflineBanner />
      </AppI18nProvider>
    </SessionProvider>
  );
}
