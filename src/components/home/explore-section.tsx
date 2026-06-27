"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  Building2,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  Footprints,
  Landmark,
  MapPinned,
  Mountain,
  Music,
  PawPrint,
  RefreshCw,
  Search,
  Sparkles,
  Trees,
  Utensils,
  Waves
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PlaceCard } from "@/components/discovery/place-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { vibes } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { PlaceDTO, RecommendationResult } from "@/types";

const vibeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
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

const VIBS_VISIBLE_DEFAULT = 6;

function VibeStrip({
  onSelect
}: {
  onSelect?: (vibe: string) => void;
}) {
  const labels = useLocalizedLabels();
  const selectedVibe = useAppStore((state) => state.selectedVibe);
  const setSelectedVibe = useAppStore((state) => state.setSelectedVibe);
  const [expanded, setExpanded] = useState(false);

  const visibleVibes = expanded ? vibes : vibes.slice(0, VIBS_VISIBLE_DEFAULT);
  const hiddenCount = vibes.length - VIBS_VISIBLE_DEFAULT;

  const handleSelect = (vibe: string) => {
    setSelectedVibe(vibe);
    onSelect?.(vibe);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase text-primary">
          <Compass className="mr-1 inline-block h-3.5 w-3.5" />
          {labels.vibe(selectedVibe) || ""}
        </p>
        {hiddenCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs"
          >
            {expanded ? (
              <>
                {`Show fewer`} <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </>
            ) : (
              <>
                {`+${hiddenCount} more`} <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {visibleVibes.map((vibe) => {
          const Icon = vibeIcons[vibe.name] ?? Sparkles;
          const active = selectedVibe === vibe.name;

          return (
            <button
              key={vibe.name}
              type="button"
              onClick={() => handleSelect(vibe.name)}
              className={cn(
                "group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition",
                active
                  ? "border-primary/50 bg-primary text-primary-foreground shadow-sm"
                  : "experience-card-home hover:border-primary/[0.24]"
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-md",
                  active ? "bg-white/[0.16]" : "bg-muted text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate font-medium">{labels.vibe(vibe.name)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ForYouTab() {
  const { t } = useTranslation();
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
        city: "Prishtina",
        budget: 4,
        location,
        transportPreference: "WALKING",
        dayPart: "EVENING",
        partySize: 2,
        avoidCrowds: false,
        limit: 3
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
  }, [selectedVibe, location, refresh]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("aiRecommendations.description")}</p>
        <Button variant="ghost" size="sm" onClick={() => setRefresh((v) => v + 1)} disabled={loading}>
          <RefreshCw className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")} />
          {t("common.refresh")}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : error || !items.length ? (
        <EmptyState
          title={t(error ? "aiRecommendations.errorTitle" : "aiRecommendations.emptyTitle")}
          description={t(error ? "aiRecommendations.errorText" : "aiRecommendations.emptyText")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.place.id}>
              <PlaceCard place={item.place} compact surface="home" />
              <div className="experience-card-home mt-2 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t("aiRecommendations.score")}</span>
                  <span className="font-mono font-bold text-primary">{item.score}</span>
                </div>
                <p className="mt-1.5 leading-5 text-muted-foreground">
                  {item.reasons.join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendingTab({ places }: { places: PlaceDTO[] }) {
  const { t } = useTranslation();
  const trending = useMemo(
    () =>
      [...places]
        .filter((place) => place.category.type !== "EVENT")
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, 6),
    [places]
  );

  if (!trending.length) {
    return (
      <EmptyState
        title={t("aiRecommendations.emptyTitle")}
        description={t("aiRecommendations.emptyText")}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trending.map((place) => (
        <PlaceCard key={place.id} place={place} compact surface="home" />
      ))}
    </div>
  );
}

type Tab = "for-you" | "trending";

export function ExploreSection({ places }: { places: PlaceDTO[] }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("for-you");

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="section-band !py-16"
    >
      <div className="page-shell space-y-6">
        <div>
          <Badge variant="blue" className="mb-3">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            {t("hero.eyebrow")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-normal">{t("vibesSection.title")}</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("vibesSection.description")}
          </p>
        </div>

        <VibeStrip />

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("for-you")}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === "for-you"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BrainCircuit className="mr-1.5 inline-block h-3.5 w-3.5" />
            {t("aiRecommendations.badge")}
          </button>
          <button
            type="button"
            onClick={() => setTab("trending")}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === "trending"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Flame className="mr-1.5 inline-block h-3.5 w-3.5" />
            {t("trending.badge")}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {tab === "for-you" ? <ForYouTab /> : <TrendingTab places={places} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
