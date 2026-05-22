"use client";

import { I18nextProvider } from "react-i18next";
import { ReactNode, useEffect } from "react";

import { i18n } from "@/i18n/client";
import { fallbackLanguage, isAppLanguage } from "@/i18n/settings";

const storageKey = "stay-kosovo-language";

function LanguagePersistence() {
  useEffect(() => {
    const persistLanguage = (language: string) => {
      const nextLanguage = isAppLanguage(language) ? language : fallbackLanguage;
      document.documentElement.lang = nextLanguage;
      window.localStorage.setItem(storageKey, nextLanguage);
      window.sessionStorage.setItem(storageKey, nextLanguage);
    };

    const stored = window.localStorage.getItem(storageKey) ?? window.sessionStorage.getItem(storageKey);
    const browserLanguage = window.navigator.language.split("-")[0];
    const nextLanguage = isAppLanguage(stored) ? stored : isAppLanguage(browserLanguage) ? browserLanguage : fallbackLanguage;

    i18n.on("languageChanged", persistLanguage);

    if (i18n.language !== nextLanguage) {
      void i18n.changeLanguage(nextLanguage);
    } else {
      persistLanguage(nextLanguage);
    }

    return () => {
      i18n.off("languageChanged", persistLanguage);
    };
  }, []);

  return null;
}

export function AppI18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguagePersistence />
      {children}
    </I18nextProvider>
  );
}
