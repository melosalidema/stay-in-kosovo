"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import "@/i18n/client";

function slug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function useLocalizedLabels() {
  const { t } = useTranslation();

  const label = useCallback(
    (namespace: string, value: string | undefined | null) => {
      if (!value) return "";
      return t(`domain.${namespace}.${slug(value)}`, { defaultValue: value });
    },
    [t]
  );

  const exact = useCallback(
    (namespace: string, value: string | undefined | null) => {
      if (!value) return "";
      return t(`domain.${namespace}.${value}`, { defaultValue: value });
    },
    [t]
  );

  return {
    vibe: useCallback((value: string) => label("vibes", value), [label]),
    vibeDescription: useCallback((value: string) => label("vibeDescriptions", value), [label]),
    category: useCallback((value: string) => label("categories", value), [label]),
    transport: useCallback((value: string) => exact("transport", value), [exact]),
    crowd: useCallback((value: string) => exact("crowd", value), [exact]),
    availability: useCallback((value: string) => exact("availability", value), [exact]),
    dayPart: useCallback((value: string) => exact("dayParts", value), [exact]),
    atmosphere: useCallback((value: string) => exact("atmosphere", value), [exact])
  };
}
