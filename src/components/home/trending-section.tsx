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
                className="experience-card-home group grid grid-cols-[116px_1fr] overflow-hidden hover:-translate-y-0.5 hover:border-primary/[0.24]"
              >
                <div className="experience-media min-h-32">
                  <Image src={place.images[0]} alt={place.title} fill sizes="140px" className="experience-image" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold leading-tight transition-colors group-hover:text-primary">{place.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {place.city}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{place.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <aside className="overflow-hidden rounded-lg border border-white/[0.12] bg-city-night bg-cover bg-center p-4 text-white shadow-pulse">
            <div className="rounded-lg border border-white/[0.14] bg-slate-950/[0.62] p-4 backdrop-blur-xl">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-teal-200" />
                {t("trending.eventHeatmap")}
              </p>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-md border border-white/10 bg-white/[0.09] p-3">
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
