"use client";

import { CalendarDays, Flame, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { events, places } from "@/data/kosovo-data";

export function TrendingSection() {
  const { t } = useTranslation();
  const trending = [...places].sort((a, b) => b.popularityScore - a.popularityScore).slice(0, 4);

  return (
    <section className="section-band bg-background">
      <div className="page-shell space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="rose" className="mb-3">
              <Flame className="mr-1 h-3.5 w-3.5" />
              {t("trending.badge")}
            </Badge>
            <h2 className="text-3xl font-bold tracking-normal">{t("trending.title")}</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/discover">{t("common.viewAll")}</Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {trending.map((place) => (
              <Link
                href={`/discover?place=${place.slug}`}
                key={place.id}
                className="group grid grid-cols-[116px_1fr] overflow-hidden rounded-lg border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-glass"
              >
                <div className="relative min-h-32">
                  <Image src={place.images[0]} alt={place.title} fill sizes="140px" className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold group-hover:text-primary">{place.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {place.city}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{place.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <aside className="rounded-lg border border-border bg-city-night bg-cover bg-center p-4 text-white shadow-glass">
            <div className="rounded-lg border border-white/15 bg-slate-950/58 p-4 backdrop-blur-xl">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-teal-200" />
                {t("trending.eventHeatmap")}
              </p>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-md bg-white/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className="text-xs text-white/70">{event.city}</p>
                      </div>
                      <Badge variant="glass">{event.heatScore}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
