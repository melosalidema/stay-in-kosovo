"use client";

import { CalendarClock, ExternalLink, MapPinned } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { places, vibes as experienceVibes } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { googleMapsRouteUrl } from "@/lib/geo";
import { getPlaceCityOptions } from "@/lib/place-options";
import { cn, formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { ItineraryDTO, TransportMethod } from "@/types";

const vibes = experienceVibes.map((vibe) => vibe.name);
const transports: TransportMethod[] = ["WALKING", "TAXI", "BUS", "BIKE", "CAR"];
const durationPresets = [
  { labelKey: "itinerary.customHours", hours: 4, days: 1 },
  { labelKey: "itinerary.fullDay", hours: 8, days: 1 },
  { labelKey: "itinerary.twoDays", hours: 16, days: 2 },
  { labelKey: "itinerary.threeDays", hours: 24, days: 3 }
];

export function ItineraryBuilder() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const draft = useAppStore((state) => state.itineraryDraft);
  const setDraft = useAppStore((state) => state.setItineraryDraft);
  const location = useAppStore((state) => state.location);
  const [itinerary, setItinerary] = useState<ItineraryDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const cities = useMemo(() => getPlaceCityOptions(places), []);

  const googleMapsUrl = useMemo(() => {
    if (!itinerary || itinerary.stops.length < 1) return null;

    const firstStop = itinerary.stops[0];
    const lastStop = itinerary.stops[itinerary.stops.length - 1];
    const origin = firstStop.mobility.route.points[0] ?? firstStop.mobility.routePoints[0] ?? firstStop.place.coordinates;
    const destination = lastStop.place.coordinates;
    const waypoints = itinerary.stops.slice(0, -1).map((stop) => stop.place.coordinates);

    return googleMapsRouteUrl({
      origin,
      destination,
      waypoints,
      travelMode:
        itinerary.routeSummary.preferredMethod === "WALKING"
          ? "walking"
          : itinerary.routeSummary.preferredMethod === "BIKE"
            ? "bicycling"
            : itinerary.routeSummary.preferredMethod === "BUS"
              ? "transit"
              : "driving"
    });
  }, [itinerary]);

  const generate = async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          interests: draft.interests.length ? draft.interests : ["food", "culture"],
          location
        })
      });
      const payload = await response.json();
      setItinerary(payload.data.itinerary);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-band">
      <div className="page-shell">
        <SectionHeading eyebrow={t("itinerary.badge")} title={t("itinerary.title")} description={t("itinerary.description")} />

        <div className="mt-9 grid gap-10 lg:grid-cols-[360px_1fr] lg:gap-14">
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="glass-panel-strong glass-panel space-y-5 rounded-2xl p-4 sm:p-5">
              <label className="grid gap-2 text-sm font-medium">
                {t("common.city")}
                <Select value={draft.city} onValueChange={(city) => setDraft({ city })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                {t("common.vibe")}
                <Select value={draft.vibe} onValueChange={(vibe) => setDraft({ vibe })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vibes.map((vibe) => (
                      <SelectItem key={vibe} value={vibe}>
                        {labels.vibe(vibe)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <div className="grid gap-2 text-sm font-medium">
                {t("itinerary.planLength")}
                <div className="flex flex-wrap gap-2">
                  {durationPresets.map((preset) => {
                    const active = draft.durationHours === preset.hours && draft.durationDays === preset.days;
                    return (
                      <button
                        key={preset.labelKey}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDraft({ durationHours: preset.hours, durationDays: preset.days })}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm transition-[background-color,border-color,color,box-shadow] duration-200 ease-calm",
                          active
                            ? "border border-primary bg-primary text-primary-foreground shadow-soft"
                            : "glass-chip border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {t(preset.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2 text-sm font-medium">
                  {t("common.budget")}
                  <Input
                    type="number"
                    min={10}
                    value={draft.budget}
                    onChange={(event) => setDraft({ budget: Number(event.target.value) })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  {t("common.hours")}
                  <Input
                    type="number"
                    min={2}
                    max={240}
                    value={draft.durationHours}
                    onChange={(event) => setDraft({ durationHours: Number(event.target.value), durationDays: undefined })}
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium">
                {t("common.transport")}
                <Select
                  value={draft.transportPreference}
                  onValueChange={(transportPreference) => setDraft({ transportPreference: transportPreference as TransportMethod })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transports.map((transport) => (
                      <SelectItem key={transport} value={transport}>
                        {labels.transport(transport)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                {t("common.interests")}
                <Textarea
                  rows={2}
                  value={draft.interests.join(", ")}
                  onChange={(event) =>
                    setDraft({
                      interests: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                    })
                  }
                  placeholder={t("itinerary.interestsPlaceholder")}
                />
              </label>

              <Button className="w-full" size="lg" onClick={generate} disabled={loading}>
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                {loading ? t("common.loading") : t("itinerary.generate")}
              </Button>
            </div>
          </aside>

          <div>
            {loading ? (
              <div className="grid min-h-[380px] place-items-center text-center">
                <p className="font-serif text-2xl text-muted-foreground">{t("explore.loading")}</p>
              </div>
            ) : error ? (
              <div className="grid min-h-[380px] place-items-center rounded-xl border border-dashed border-border p-8 text-center">
                <div className="max-w-sm">
                  <p className="font-serif text-2xl">{t("explore.errorTitle")}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("explore.errorText")}</p>
                  <Button className="mt-5" variant="outline" onClick={generate}>
                    {t("common.refresh")}
                  </Button>
                </div>
              </div>
            ) : itinerary ? (
              <>
                <h2 className="font-serif text-3xl leading-tight">{itinerary.title}</h2>
                <p className="lede mt-3 max-w-2xl text-[0.9375rem] sm:text-base">{itinerary.description}</p>

                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>{formatCurrency(itinerary.totalCost)}</span>
                  <span>
                    {itinerary.durationHours}
                    {t("common.hoursShort")}
                  </span>
                  <span>{t("itinerary.days", { count: itinerary.durationDays })}</span>
                  <span>{t("itinerary.travel", { minutes: itinerary.routeSummary.travelMinutes })}</span>
                </div>

                {googleMapsUrl && (
                  <Button asChild className="mt-5" variant="outline" size="sm">
                    <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      {t("common.openInGoogleMaps")}
                    </a>
                  </Button>
                )}

                <ol className="mt-9">
                  {itinerary.stops.map((stop, index) => (
                    <li key={stop.order} className="grid grid-cols-[4.5rem_1fr] gap-x-5">
                      <div className="pt-0.5 text-right">
                        <p className="font-serif text-xl tabular-nums leading-none">{stop.startTime}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {t("itinerary.stay", { minutes: stop.durationMinutes })}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "border-l border-border pl-5",
                          index === itinerary.stops.length - 1 ? "pb-0" : "pb-9"
                        )}
                      >
                        <h3 className="text-lg font-semibold leading-snug">{stop.place.title}</h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                          <MapPinned className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {stop.place.city} · {labels.category(stop.place.category.slug)}
                          <span className="text-muted-foreground/60">·</span>
                          <span>{formatCurrency(stop.estimatedCost)}</span>
                        </p>
                        {stop.note && <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{stop.note}</p>}
                        <p className="mt-2.5 text-xs text-muted-foreground">
                          {stop.mobility.label} · {t("itinerary.travel", { minutes: stop.travelMinutes })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <div className="grid min-h-[380px] place-items-center rounded-xl border border-dashed border-border p-8 text-center">
                <div className="max-w-md">
                  <p className="font-serif text-2xl">{t("itinerary.emptyTitle")}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("itinerary.emptyText")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
