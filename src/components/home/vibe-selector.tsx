"use client";

import { motion } from "framer-motion";
import { Music, Mountain, Search, Sparkles, Trees, Utensils, Waves } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

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
  "Family Friendly": Trees
};

export function VibeSelector() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const selectedVibe = useAppStore((state) => state.selectedVibe);
  const setSelectedVibe = useAppStore((state) => state.setSelectedVibe);

  return (
    <section className="section-band bg-background">
      <div className="page-shell space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">{t("vibesSection.eyebrow")}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">{t("vibesSection.title")}</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/discover">{t("vibesSection.openFilters")}</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {vibes.map((vibe, index) => {
            const Icon = icons[vibe.name];
            const active = selectedVibe === vibe.name;

            return (
              <motion.button
                key={vibe.name}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                onClick={() => setSelectedVibe(vibe.name)}
                className={cn(
                  "group min-h-36 text-left transition",
                  active
                    ? "rounded-lg border border-primary/[0.7] bg-primary p-4 text-primary-foreground shadow-card-hover"
                    : "experience-card-home p-4 hover:-translate-y-0.5 hover:border-primary/[0.3]"
                )}
              >
                <span
                  className={cn(
                    "mb-4 grid h-10 w-10 place-items-center rounded-md",
                    active ? "bg-white/[0.18]" : "bg-muted text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="block text-sm font-bold">{labels.vibe(vibe.name)}</span>
                <span className={cn("mt-2 block text-xs leading-5", active ? "text-white/[0.78]" : "text-muted-foreground")}>
                  {labels.vibeDescription(vibe.name)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
