"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/locales/en.json";
import sq from "@/i18n/locales/sq.json";
import { fallbackLanguage } from "@/i18n/settings";

const resources = {
  en: { translation: en },
  sq: { translation: sq }
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: fallbackLanguage,
    fallbackLng: fallbackLanguage,
    supportedLngs: Object.keys(resources),
    interpolation: {
      escapeValue: true
    },
    returnNull: false,
    saveMissing: false,
    missingKeyHandler: (_lngs, _ns, key) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] Missing translation key: ${key}`);
      }
    }
  });
}

export { i18n };
