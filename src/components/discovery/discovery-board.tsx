"use client";

import { RefreshCw, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CategoryLegend } from "@/components/discovery/category-legend";
import { EmptyState } from "@/components/ui/empty-state";
import { MapPanel } from "@/components/discovery/map-panel";
import { PlaceCard } from "@/components/discovery/place-card";
import type { MapSelectionSource } from "@/components/maps/google-places-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { places as fallbackPlaces, vibes } from "@/data/kosovo-data";
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
    if (element) placeCardRefs.current.set(placeId, element);
    else placeCardRefs.current.delete(placeId);
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
      <div className="page-shell">
        <SectionHeading
          eyebrow={t("discover.badge")}
          title={t("discover.title")}
          description={t("discover.description")}
        />

        <div className="mt-7 space-y-4 border-y border-border py-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="relative sm:col-span-2 lg:col-span-2">
              <span className="sr-only">{t("discover.searchPlaceholder")}</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                className="pl-10"
                placeholder={t("discover.searchPlaceholder")}
                value={filters.q}
                onChange={(event) => setFilters({ q: event.target.value })}
              />
            </label>

            <Select value={filters.city || ALL_KOSOVO_CITY} onValueChange={(city) => setFilters({ city: city === ALL_KOSOVO_CITY ? "" : city })}>
              <SelectTrigger aria-label={t("common.city")}>
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

            <Select value={filters.vibe || "all"} onValueChange={(vibe) => setFilters({ vibe: vibe === "all" ? "" : vibe })}>
              <SelectTrigger aria-label={t("common.vibe")}>
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
              <SelectTrigger aria-label={t("common.budget")}>
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={filters.openNow}
              onClick={() => setFilters({ openNow: !filters.openNow })}
              className={
                "rounded-lg border px-3 py-1.5 text-sm transition-colors duration-200 " +
                (filters.openNow
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground")
              }
            >
              {t("common.openNow")}
            </button>
            <button
              type="button"
              aria-pressed={filters.transport === "WALKING"}
              onClick={() => setFilters({ transport: filters.transport === "WALKING" ? "" : "WALKING" })}
              className={
                "rounded-lg border px-3 py-1.5 text-sm transition-colors duration-200 " +
                (filters.transport === "WALKING"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground")
              }
            >
              {t("common.walkable")}
            </button>
            <button
              type="button"
              aria-pressed={filters.transport === "BUS"}
              onClick={() => setFilters({ transport: filters.transport === "BUS" ? "" : "BUS" })}
              className={
                "rounded-lg border px-3 py-1.5 text-sm transition-colors duration-200 " +
                (filters.transport === "BUS"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground")
              }
            >
              {t("common.busNearby")}
            </button>

            <span className="ml-auto text-sm text-muted-foreground">
              {relaxedFallback
                ? t("discover.relaxedMatching", { count: places.length })
                : t("discover.matching", { count: places.length })}
            </span>

            <Button variant="ghost" size="sm" onClick={resetFilters} disabled={!hasActiveFilters}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t("discover.resetFilters")}
            </Button>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={filter.clear}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {filter.label}
                  <X className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">{t("discover.resetFilters")}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {(relaxedFallback || loadError) && (
          <p className="mt-5 rounded-lg border border-amber-600/20 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            {loadError ? t("discover.loadFallback") : t("discover.relaxedNotice")}
          </p>
        )}

        <div className="mt-8 space-y-7">
          <MapPanel
            places={mapPlaces}
            selectedPlaceId={selectedPlaceId}
            onSelectedPlaceChange={(place, source) => selectPlace(place, source)}
          />

          <CategoryLegend selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))
            ) : filteredPlaces.length ? (
              filteredPlaces.map((place, index) => (
                <Reveal key={place.id} delay={(index % 3) * 70} className="h-full">
                  <div ref={(element) => setPlaceCardRef(place.id, element)} className="h-full">
                    <PlaceCard
                      place={place}
                      selected={selectedPlaceId === place.id}
                      onSelect={(selectedPlace) => selectPlace(selectedPlace, "card")}
                    />
                  </div>
                </Reveal>
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-3">
                <EmptyState title={t("discover.emptyTitle")} description={t("discover.emptyText")} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
