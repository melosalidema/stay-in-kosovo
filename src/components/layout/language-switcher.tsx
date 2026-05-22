"use client";

import { ChevronDown, Languages } from "lucide-react";
import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { fallbackLanguage, isAppLanguage, languages } from "@/i18n/settings";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const options = languages;
  const currentCode = isAppLanguage(i18n.language) ? i18n.language : fallbackLanguage;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value;

    if (isAppLanguage(nextLanguage) && nextLanguage !== i18n.language) {
      void i18n.changeLanguage(nextLanguage);
    }
  };

  return (
    <label className={cn("relative block", compact ? "min-w-0 flex-1" : "min-w-[132px]")}>
      <span className="sr-only">{t("languageSwitcher.label")}</span>
      <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      <select
        aria-label={t("languageSwitcher.label")}
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-input bg-background/70 py-2 pl-9 pr-8 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring",
          compact ? "min-w-0" : "w-[132px]"
        )}
        value={currentCode}
        onChange={handleChange}
      >
        {options.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.nativeLabel}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
    </label>
  );
}
