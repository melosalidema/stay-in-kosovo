"use client";

import { BrainCircuit, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { PlaceCard } from "@/components/discovery/place-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { useAppStore } from "@/store/app-store";
import type { RecommendationResult } from "@/types";

type ApiResponse = {
  ok: true;
  data: {
    recommendations: RecommendationResult[];
  };
};

export function AiRecommendations() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
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
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load recommendations.");
        return response.json();
      })
      .then((payload: ApiResponse) => {
        if (!cancelled) setItems(payload.data.recommendations);
      })
      .catch((requestError) => {
        console.warn("[Stay Kosovo recommendations] Unable to load recommendations:", requestError);
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
    <section className="section-band bg-muted/[0.3]">
      <div className="page-shell space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="blue" className="mb-3">
              <BrainCircuit className="mr-1 h-3.5 w-3.5" />
              {t("aiRecommendations.badge")}
            </Badge>
            <h2 className="text-3xl font-bold tracking-normal">
              {t("aiRecommendations.title", { vibe: labels.vibe(selectedVibe).toLowerCase() })}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("aiRecommendations.description")}
            </p>
          </div>
          <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-lg" />)
          ) : error || !items.length ? (
            <div className="experience-card-home p-5 md:col-span-3">
              <p className="font-semibold">{t(error ? "aiRecommendations.errorTitle" : "aiRecommendations.emptyTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(error ? "aiRecommendations.errorText" : "aiRecommendations.emptyText")}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.place.id} className="space-y-3">
                <PlaceCard place={item.place} compact surface="home" />
                <div className="experience-card-home p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t("aiRecommendations.score")}</span>
                    <span className="text-primary">{item.score}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.reasons.join(" · ")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
