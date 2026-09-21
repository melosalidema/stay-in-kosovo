"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { fallbackLanguage, isAppLanguage, languages } from "@/i18n/settings";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const currentCode = isAppLanguage(i18n.language) ? i18n.language : fallbackLanguage;
  const current = languages.find((language) => language.code === currentCode) ?? languages[0];

  const select = (code: string) => {
    if (isAppLanguage(code) && code !== i18n.language) {
      void i18n.changeLanguage(code);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t("languageSwitcher.label")}
        className={cn(
          "glass-chip inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground outline-none",
          "transition-[background-color,border-color] duration-200 ease-calm",
          "hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          compact && "w-full justify-between"
        )}
      >
        <Languages className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">
          <span aria-hidden="true">{current.flag}</span> {current.nativeLabel}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            "glass-panel-strong glass-panel z-50 min-w-[11rem] overflow-hidden rounded-xl p-1",
            "data-[state=open]:animate-fade-in"
          )}
        >
          <DropdownMenu.Label className="px-3 pb-1 pt-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("languageSwitcher.placeholder")}
          </DropdownMenu.Label>

          {languages.map((language) => {
            const active = language.code === currentCode;
            return (
              <DropdownMenu.Item
                key={language.code}
                onSelect={() => select(language.code)}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-150",
                  active
                    ? "bg-primary/[0.12] font-medium text-primary"
                    : "text-foreground data-[highlighted]:bg-secondary data-[highlighted]:text-foreground"
                )}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  {language.flag}
                </span>
                <span className="flex-1 truncate">{language.nativeLabel}</span>
                <span className="text-xs text-muted-foreground">{language.label}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
