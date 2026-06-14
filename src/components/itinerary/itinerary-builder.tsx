"use client";

import { CalendarClock, Euro, MapPinned, Route, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { vibes as experienceVibes } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { ItineraryDTO, TransportMethod } from "@/types";

const cities = ["Prishtina", "Prizren", "Peja", "Gjakova", "Brezovica"];
const vibes = experienceVibes.map((vibe) => vibe.name);
const transports: TransportMethod[] = ["WALKING", "TAXI", "BUS", "BIKE", "CAR"];

export function ItineraryBuilder() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const draft = useAppStore((state) => state.itineraryDraft);
  const setDraft = useAppStore((state) => state.setItineraryDraft);
  const location = useAppStore((state) => state.location);
  const [itinerary, setItinerary] = useState<ItineraryDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  return (
    <section className="section-band">
      <div className="page-shell grid gap-6 lg:grid-cols-[420px_1fr]">
        <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-glass">
          <Badge variant="blue" className="mb-4">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            {t("itinerary.badge")}
          </Badge>
          <h1 className="text-3xl font-bold tracking-normal">{t("itinerary.title")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("itinerary.description")}
          </p>

          <div className="mt-6 space-y-4">
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
                  max={72}
                  value={draft.durationHours}
                  onChange={(event) => setDraft({ durationHours: Number(event.target.value) })}
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              {t("common.interests")}
              <Textarea
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
            <label className="grid gap-2 text-sm font-medium">
              {t("common.transport")}
              <Select value={draft.transportPreference} onValueChange={(transportPreference) => setDraft({ transportPreference: transportPreference as TransportMethod })}>
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
            <Button className="w-full" size="lg" onClick={generate} disabled={loading}>
              <Sparkles className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {t("itinerary.generate")}
            </Button>
          </div>
        </aside>

        <div className="space-y-5">
          {itinerary ? (
            <>
              <div className="rounded-lg border border-border bg-card p-5 shadow-glass">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <Badge variant="green" className="mb-3">
                      {t("itinerary.generatedRoute")}
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-normal">{itinerary.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{itinerary.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-md bg-muted p-3">
                      <Euro className="mx-auto mb-1 h-4 w-4 text-primary" />
                      {formatCurrency(itinerary.totalCost)}
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <CalendarClock className="mx-auto mb-1 h-4 w-4 text-primary" />
                      {itinerary.durationHours}h
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <Route className="mx-auto mb-1 h-4 w-4 text-primary" />
                      {itinerary.routeSummary.travelMinutes}m
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {itinerary.stops.map((stop) => (
                  <article key={stop.order} className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-[96px_1fr]">
                    <div className="rounded-md bg-primary/10 p-3 text-center text-primary">
                      <p className="text-xs font-semibold">{t("itinerary.stop", { order: stop.order })}</p>
                      <p className="mt-1 text-xl font-bold">{stop.startTime}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-bold">{stop.place.title}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPinned className="h-3.5 w-3.5" />
                            {stop.place.city} · {labels.category(stop.place.category.slug)}
                          </p>
                        </div>
                        <Badge variant="outline">{formatCurrency(stop.estimatedCost)}</Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{stop.note}</p>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <span className="rounded-md bg-muted p-2">{t("itinerary.stay", { minutes: stop.durationMinutes })}</span>
                        <span className="rounded-md bg-muted p-2">{t("itinerary.travel", { minutes: stop.travelMinutes })}</span>
                        <span className="rounded-md bg-muted p-2">{stop.mobility.label}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="grid min-h-[520px] place-items-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <div className="max-w-md">
                <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" />
                <h2 className="text-2xl font-bold">{t("itinerary.emptyTitle")}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("itinerary.emptyText")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
