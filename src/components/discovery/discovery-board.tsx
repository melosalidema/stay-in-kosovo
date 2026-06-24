"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Filter, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CategoryLegend } from "@/components/discovery/category-legend";
import { MapPanel } from "@/components/discovery/map-panel";
import { PlaceCard } from "@/components/discovery/place-card";
import type { MapSelectionSource } from "@/components/maps/google-places-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { categories, places as fallbackPlaces, vibes } from "@/data/kosovo-data";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { ALL_KOSOVO_CITY, getPlaceCityOptions, validatePlaceCityAssignments } from "@/lib/place-options";
import { useAppStore } from "@/store/app-store";
import type { PlaceDTO } from "@/types";

type ApiResponse = {
  ok: true;
  data: {
    places: PlaceDTO[];
  };
};

export function DiscoveryBoard() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const [places, setPlaces] = useState<PlaceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [relaxedFallback, setRelaxedFallback] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const placeCardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const debouncedQuery = useDebounce(filters.q);
  const cityOptions = useMemo(() => getPlaceCityOptions(fallbackPlaces), []);
  const invalidCityRecords = useMemo(() => validatePlaceCityAssignments(fallbackPlaces), []);
  const mapPlaces = places.length ? places : fallbackPlaces;
  const filteredPlaces = selectedCategory
    ? mapPlaces.filter((place) => place.category.slug === selectedCategory)
    : mapPlaces;
  const hasActiveFilters = Boolean(
    debouncedQuery ||
      filters.city ||
      filters.category ||
      filters.vibe ||
      filters.budget ||
      filters.openNow ||
      filters.rating ||
      filters.transport
  );
  const activeFilters = useMemo(
    () =>
      [
        debouncedQuery ? { key: "q", label: debouncedQuery, clear: () => setFilters({ q: "" }) } : null,
        filters.city ? { key: "city", label: filters.city, clear: () => setFilters({ city: "" }) } : null,
        filters.category ? { key: "category", label: labels.category(filters.category), clear: () => setFilters({ category: "" }) } : null,
        filters.vibe ? { key: "vibe", label: labels.vibe(filters.vibe), clear: () => setFilters({ vibe: "" }) } : null,
        filters.budget ? { key: "budget", label: `${t("common.budget")} ${filters.budget}`, clear: () => setFilters({ budget: 0 }) } : null,
        filters.openNow ? { key: "openNow", label: t("common.openNow"), clear: () => setFilters({ openNow: false }) } : null,
        filters.rating ? { key: "rating", label: `${t("common.rating")} ${filters.rating}+`, clear: () => setFilters({ rating: 0 }) } : null,
        filters.transport ? { key: "transport", label: labels.transport(filters.transport), clear: () => setFilters({ transport: "" }) } : null
      ].filter((filter): filter is { key: string; label: string; clear: () => void } => Boolean(filter)),
    [debouncedQuery, filters, labels, setFilters, t]
  );

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
    if (invalidCityRecords.length > 0) {
      console.warn("[Stay Kosovo discover] Places with missing city values:", invalidCityRecords);
    }
  }, [invalidCityRecords]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    async function loadPlaces() {
      try {
        const response = await fetch(`/api/places?${queryString}`);
        if (!response.ok) throw new Error("Failed to load places.");
        const payload = (await response.json()) as ApiResponse;
        const exactPlaces = payload.data?.places ?? [];

        if (cancelled) return;

        if (exactPlaces.length || !queryString) {
          setPlaces(exactPlaces);
          setRelaxedFallback(false);
          return;
        }

        const fallbackResponse = await fetch("/api/places");
        if (!fallbackResponse.ok) throw new Error("Failed to load fallback places.");
        const fallbackPayload = (await fallbackResponse.json()) as ApiResponse;

        if (cancelled) return;

        setPlaces(fallbackPayload.data?.places ?? fallbackPlaces);
        setRelaxedFallback(true);
      } catch (error) {
        if (cancelled) return;

        console.warn("[Stay Kosovo discover] Falling back to static places after load failure:", error);
        setPlaces(fallbackPlaces);
        setRelaxedFallback(true);
        setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlaces();

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  useEffect(() => {
    setSelectedPlaceId((current) => (current && mapPlaces.some((place) => place.id === current) ? current : null));
  }, [mapPlaces]);

  const setPlaceCardRef = (placeId: string, element: HTMLElement | null) => {
    if (element) {
      placeCardRefs.current.set(placeId, element);
    } else {
      placeCardRefs.current.delete(placeId);
    }
  };

  const selectPlace = (place: PlaceDTO, source: MapSelectionSource | "card") => {
    setSelectedPlaceId(place.id);

    if (source === "marker") {
      window.setTimeout(() => {
        placeCardRefs.current.get(place.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
    }
  };

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
            {relaxedFallback
              ? t("discover.relaxedMatching", { count: places.length })
              : t("discover.matching", { count: places.length })}
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
          <Select value={filters.city || ALL_KOSOVO_CITY} onValueChange={(city) => setFilters({ city: city === ALL_KOSOVO_CITY ? "" : city })}>
            <SelectTrigger>
              <SelectValue placeholder={t("common.city")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_KOSOVO_CITY}>{t("common.allKosovo")}</SelectItem>
              {cityOptions.map((city) => (
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
          <Select value={filters.budget ? String(filters.budget) : "all"} onValueChange={(budget) => setFilters({ budget: budget === "all" ? 0 : Number(budget) })}>
            <SelectTrigger>
              <SelectValue placeholder={t("common.budget")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.anyBudget")}</SelectItem>
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("discover.resetFilters")}
            </Button>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3 lg:col-span-6">
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={filter.clear}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/[0.14]"
                >
                  {filter.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        {(relaxedFallback || loadError) && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            {loadError ? t("discover.loadFallback") : t("discover.relaxedNotice")}
          </div>
        )}

        <div className="space-y-6">
          <MapPanel
            places={mapPlaces}
            selectedPlaceId={selectedPlaceId}
            onSelectedPlaceChange={(place, source) => selectPlace(place, source)}
          />
          <CategoryLegend
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-[360px] rounded-lg bg-muted/[0.7]" />)
            ) : filteredPlaces.length ? (
              <AnimatePresence mode="popLayout">
                {filteredPlaces.map((place) => (
                  <motion.div
                    key={place.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    ref={(element) => setPlaceCardRef(place.id, element)}
                  >
                    <PlaceCard
                      place={place}
                      selected={selectedPlaceId === place.id}
                      onSelect={(selectedPlace) => selectPlace(selectedPlace, "card")}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="experience-card-discovery p-8 text-center sm:col-span-2 lg:col-span-3">
                <p className="font-bold">{t("discover.emptyTitle")}</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t("discover.emptyText")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
