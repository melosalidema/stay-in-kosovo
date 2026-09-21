"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PlaceCard } from "@/components/discovery/place-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { PlaceDTO, RecommendationResult } from "@/types";

function useRecommendations(limit: number) {
  const selectedVibe = useAppStore((state) => state.selectedVibe);
  const location = useAppStore((state) => state.location);
  const [items, setItems] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vibes: [selectedVibe],
        budget: 4,
        location,
        transportPreference: "WALKING",
        partySize: 2,
        avoidCrowds: false,
        limit
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((payload: { data: { recommendations: RecommendationResult[] } }) => {
        if (!cancelled) setItems(payload.data.recommendations);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVibe, location, refresh, limit]);

  return { items, loading, error, refresh: () => setRefresh((value) => value + 1) };
}

type Tab = "for-you" | "popular";

export function ExploreSection({ places }: { places: PlaceDTO[] }) {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const selectedVibe = useAppStore((state) => state.selectedVibe);
  const [tab, setTab] = useState<Tab>("for-you");
  const { items, loading, error, refresh } = useRecommendations(6);

  const popular = useMemo(
    () =>
      [...places]
        .filter((place) => place.category.type !== "EVENT")
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, 6),
    [places]
  );

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "for-you", label: t("explore.recommended") },
    { id: "popular", label: t("explore.popular") }
  ];

  return (
    <section className="section-band section-plain bg-background">
      <div className="page-shell">
        <SectionHeading
          eyebrow={t("explore.eyebrow")}
          title={t("explore.title", { vibe: labels.vibe(selectedVibe).toLowerCase() })}
          description={t("explore.description")}
          action={
            tab === "for-you" ? (
              <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
                {t("common.refresh")}
              </Button>
            ) : null
          }
        />

        <div className="mt-7 flex gap-7 border-b border-border" role="tablist">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={cn(
                  "-mb-px border-b-2 pb-3 text-sm transition-colors duration-200",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7"
          >
            {tab === "for-you" ? (
              loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <Skeleton className="aspect-[4/3] rounded-xl" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  ))}
                  <p className="sr-only">{t("explore.loading")}</p>
                </div>
              ) : error || !items.length ? (
                <EmptyState
                  title={t(error ? "explore.errorTitle" : "explore.emptyTitle")}
                  description={t(error ? "explore.errorText" : "explore.emptyText")}
                />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, index) => (
                    <Reveal key={item.place.id} delay={index * 70} className="h-full">
                      <PlaceCard place={item.place} surface="home" />
                    </Reveal>
                  ))}
                </div>
              )
            ) : popular.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {popular.map((place, index) => (
                  <Reveal key={place.id} delay={index * 70} className="h-full">
                    <PlaceCard place={place} surface="home" />
                  </Reveal>
                ))}
              </div>
            ) : (
              <EmptyState title={t("explore.emptyTitle")} description={t("explore.emptyText")} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
