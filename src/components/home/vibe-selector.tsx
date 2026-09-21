"use client";

import {
  Building2,
  Footprints,
  Landmark,
  MapPinned,
  Mountain,
  Music,
  PawPrint,
  Search,
  Sparkles,
  Trees,
  Utensils,
  Waves
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { vibes } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const icons = {
  Chill: Waves,
  Nightlife: Music,
  Romantic: Sparkles,
  Adventure: Mountain,
  "Local Food": Utensils,
  "Hidden Gems": Search,
  "Family Friendly": Trees,
  Culture: Landmark,
  "Sacred & Spiritual": Landmark,
  "Adventure & Trails": Footprints,
  "Wildlife & Nature": PawPrint,
  "Living History": Landmark,
  "Ottoman Heritage": Building2,
  "City Life": MapPinned
};

export function VibeSelector() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const selectedVibe = useAppStore((state) => state.selectedVibe);
  const setSelectedVibe = useAppStore((state) => state.setSelectedVibe);

  const activeDescription = labels.vibeDescription(selectedVibe);

  return (
    <section className="section-band section-plain">
      <div className="page-shell">
        <SectionHeading
          eyebrow={t("vibesSection.eyebrow")}
          title={t("vibesSection.title")}
          description={t("vibesSection.description")}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/discover">{t("vibesSection.openFilters")}</Link>
            </Button>
          }
        />

        <div className="glass-panel mt-7 rounded-2xl p-3 sm:p-5">
          <div
            role="group"
            aria-label={t("vibesSection.title")}
            className="no-scrollbar edge-fade -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            {vibes.map((vibe) => {
              const Icon = icons[vibe.name] ?? Sparkles;
              const active = selectedVibe === vibe.name;

              return (
                <button
                  key={vibe.name}
                  type="button"
                  onClick={() => setSelectedVibe(vibe.name)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm transition-[background-color,border-color,color,box-shadow] duration-200 ease-calm",
                    active
                      ? "border border-primary bg-primary text-primary-foreground shadow-soft"
                      : "glass-chip border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">{labels.vibe(vibe.name)}</span>
                </button>
              );
            })}
          </div>

          {activeDescription && (
            <p className="mt-4 max-w-2xl border-t border-[rgb(var(--glass-border))] pt-4 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">{labels.vibe(selectedVibe)}</span>
              {" — "}
              {activeDescription}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
