"use client";

import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MapPanel } from "@/components/discovery/map-panel";
import { PlaceCard } from "@/components/discovery/place-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { categories, vibes } from "@/data/kosovo-data";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { useAppStore } from "@/store/app-store";
import type { PlaceDTO } from "@/types";

type ApiResponse = {
  ok: true;
  data: {
    places: PlaceDTO[];
  };
};

const cities = ["Prishtina", "Prizren", "Peja", "Gjakova", "Brezovica"];

export function DiscoveryBoard() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const [places, setPlaces] = useState<PlaceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const debouncedQuery = useDebounce(filters.q);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (filters.city) params.set("city", filters.city);
    if (filters.category) params.set("category", filters.category);
    if (filters.vibe) params.set("vibe", filters.vibe);
    if (filters.budget) params.set("budget", String(filters.budget));
    if (filters.openNow) params.set("openNow", "true");
    if (filters.rating) params.set("rating", String(filters.rating));
    if (filters.transport) params.set("transport", filters.transport);
    return params.toString();
  }, [debouncedQuery, filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/places?${queryString}`)
      .then((response) => response.json())
      .then((payload: ApiResponse) => {
        if (!cancelled) setPlaces(payload.data.places);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  return (
    <section className="section-band">
      <div className="page-shell space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="green" className="mb-3">
              <Filter className="mr-1 h-3.5 w-3.5" />
              {t("discover.badge")}
            </Badge>
            <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">{t("discover.title")}</h1>
            <p className="mt-3 text-muted-foreground">
              {t("discover.description")}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/[0.82] px-3 py-2 text-sm shadow-editorial">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            {t("discover.matching", { count: places.length })}
          </div>
        </div>

        <div className="experience-card-discovery grid gap-3 bg-card/[0.82] p-3 backdrop-blur-xl md:grid-cols-2 lg:grid-cols-6">
          <label className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("discover.searchPlaceholder")}
              value={filters.q}
              onChange={(event) => setFilters({ q: event.target.value })}
            />
          </label>
          <Select value={filters.city} onValueChange={(city) => setFilters({ city })}>
            <SelectTrigger>
              <SelectValue placeholder={t("common.city")} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.category || "all"} onValueChange={(category) => setFilters({ category: category === "all" ? "" : category })}>
            <SelectTrigger>
              <SelectValue placeholder={t("common.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allCategories")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.slug} value={category.slug}>
                  {labels.category(category.slug)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.vibe || "all"} onValueChange={(vibe) => setFilters({ vibe: vibe === "all" ? "" : vibe })}>
            <SelectTrigger>
              <SelectValue placeholder={t("common.vibe")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allVibes")}</SelectItem>
              {vibes.map((vibe) => (
                <SelectItem key={vibe.name} value={vibe.name}>
                  {labels.vibe(vibe.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(filters.budget)} onValueChange={(budget) => setFilters({ budget: Number(budget) })}>
            <SelectTrigger>
              <SelectValue placeholder={t("common.budget")} />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((level) => (
                <SelectItem key={level} value={String(level)}>
                  {t("common.budget")} {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2 lg:col-span-6">
            <Button
              type="button"
              variant={filters.openNow ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ openNow: !filters.openNow })}
            >
              {t("common.openNow")}
            </Button>
            <Button
              type="button"
              variant={filters.transport === "WALKING" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ transport: filters.transport === "WALKING" ? "" : "WALKING" })}
            >
              {t("common.walkable")}
            </Button>
            <Button
              type="button"
              variant={filters.transport === "BUS" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ transport: filters.transport === "BUS" ? "" : "BUS" })}
            >
              {t("common.busNearby")}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="grid gap-5 sm:grid-cols-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-[360px] rounded-lg bg-muted/[0.7]" />)
            ) : places.length ? (
              places.map((place) => <PlaceCard key={place.id} place={place} />)
            ) : (
              <div className="experience-card-discovery p-8 text-center sm:col-span-2">
                <p className="font-bold">{t("discover.emptyTitle")}</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t("discover.emptyText")}</p>
              </div>
            )}
          </div>
          <MapPanel places={places} />
        </div>
      </div>
    </section>
  );
}
