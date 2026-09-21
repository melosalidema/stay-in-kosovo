"use client";

import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { buildHeroImageRotation, featuredHeroImage } from "@/components/home/hero-image-rotation";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { placeImageLoader, shouldBypassNextImageOptimization } from "@/lib/place-images";
import type { EventDTO, PlaceDTO } from "@/types";

type HeroSectionProps = {
  featuredPlaces: PlaceDTO[];
  featuredEvents?: EventDTO[];
};

export function HeroSection({ featuredPlaces, featuredEvents = [] }: HeroSectionProps) {
  const { t } = useTranslation();
  const { requestLocation, loading, error } = useGeolocation();

  const rotation = useMemo(
    () => buildHeroImageRotation([...featuredPlaces, ...featuredEvents]),
    [featuredPlaces, featuredEvents]
  );

  const lead = featuredHeroImage;
  const second = rotation[0];

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="page-shell-wide grid items-center gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:gap-16 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="animate-fade-up">
          <p className="eyebrow">{t("hero.eyebrow")}</p>

          <h1 className="display-1 mt-4 max-w-xl">{t("hero.title")}</h1>

          <p className="lede mt-5 max-w-lg">{t("hero.description")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href="/discover">
                {t("hero.exploreNow")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/itinerary">{t("hero.planDay")}</Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              <MapPin className={loading ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} aria-hidden="true" />
              {t("hero.useLocation")}
            </button>
            <Link
              href="/pulse"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("hero.tonightLink")}
            </Link>
          </div>

          {error && <p className="mt-3 text-sm text-muted-foreground">{t(error)}</p>}
        </div>

        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="media-frame aspect-[16/11] shadow-soft lg:aspect-[4/5]">
            <Image
              src={lead.src}
              alt={lead.city ? `${lead.label}, ${lead.city}` : lead.label}
              fill
              priority
              sizes="(min-width: 1024px) 44vw, 100vw"
              loader={placeImageLoader}
              unoptimized={shouldBypassNextImageOptimization(lead.src)}
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/60 to-transparent" />
            <figcaption className="absolute bottom-4 left-4 right-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-white">
              <span className="font-medium">{lead.label}</span>
              {lead.city && <span className="text-white/65">/ {lead.city}</span>}
              <span className="w-full text-[0.6875rem] leading-4 text-white/55">
                {t("hero.photoCredit")}
              </span>
            </figcaption>
          </div>

          {second && (
            <div className="absolute -bottom-6 -left-4 hidden w-40 overflow-hidden rounded-xl border-4 border-background shadow-lift sm:block lg:-left-10 lg:w-48">
              <div className="relative aspect-[4/3]">
                <Image
                  src={second.src}
                  alt={second.city ? `${second.label}, ${second.city}` : second.label}
                  fill
                  sizes="192px"
                  loader={placeImageLoader}
                  unoptimized={shouldBypassNextImageOptimization(second.src)}
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
