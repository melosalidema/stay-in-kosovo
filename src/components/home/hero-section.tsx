"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, LocateFixed, RadioTower, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { KosovoPulseMap } from "@/components/home/kosovo-pulse-map";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { Tooltip } from "@/components/ui/tooltip";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { EventDTO, PlaceDTO } from "@/types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80";

type HeroSectionProps = {
  featuredPlaces: PlaceDTO[];
  featuredEvents?: EventDTO[];
};

export function HeroSection({ featuredPlaces, featuredEvents = [] }: HeroSectionProps) {
  const { t } = useTranslation();
  const { requestLocation, loading, error } = useGeolocation();

  const cityCount = useMemo(
    () => new Set(featuredPlaces.map((place) => place.city).filter(Boolean)).size,
    [featuredPlaces]
  );
  const vibeCount = useMemo(
    () => new Set(featuredPlaces.flatMap((place) => place.vibeTags)).size,
    [featuredPlaces]
  );

  const heroStats = [
    {
      id: "signals",
      value: String(featuredPlaces.length),
      label: t("hero.stats.signals"),
      tooltip: t("hero.stats.signalsTip")
    },
    {
      id: "vibes",
      value: String(vibeCount),
      label: t("hero.stats.vibes"),
      tooltip: t("hero.stats.vibesTip")
    },
    {
      id: "layers",
      value: String(cityCount),
      label: t("hero.stats.layers"),
      tooltip: t("hero.stats.layersTip")
    }
  ];

  const firstPlace = featuredPlaces[0] ?? featuredEvents[0];

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,23,30,0.82),rgba(24,93,88,0.34),rgba(144,82,53,0.16))]" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/18 via-slate-950/8 to-background" />

      <div className="relative mx-auto grid max-w-7xl gap-8 py-12 lg:min-h-[72svh] lg:grid-cols-[1fr_460px] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.12] px-3 py-1 text-sm backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-teal-200" />
            {t("hero.eyebrow")}
          </div>

          <h1 className="max-w-4xl text-5xl font-black tracking-normal sm:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.82] sm:text-lg">
            {t("hero.description")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/discover">
                {t("hero.exploreNow")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link href="/pulse">
                <RadioTower className="h-4 w-4" />
                {t("hero.cityPulse")}
              </Link>
            </Button>
            <Button variant="glass" size="lg" onClick={requestLocation}>
              <LocateFixed className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {t("hero.useLocation")}
            </Button>
          </div>

          {error && <p className="mt-3 text-sm text-amber-100">{t(error)}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {firstPlace && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/78 backdrop-blur-xl">
                <span>{firstPlace.title}</span>
                {firstPlace.city && <span className="text-white/48">/ {firstPlace.city}</span>}
              </span>
            )}
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {heroStats.map((stat) => (
              <div
                key={stat.id}
                className="group relative overflow-hidden rounded-lg border border-white/[0.16] bg-white/[0.12] p-3 backdrop-blur-xl transition-[border-color,box-shadow] hover:border-white/[0.28] hover:shadow-lg"
                tabIndex={0}
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 origin-left scale-x-0 bg-teal-200 transition-transform duration-300 group-hover:scale-x-100" />
                <p className="relative z-10 text-2xl font-bold"><CountUp value={stat.value} /></p>
                <p className="relative z-10 flex items-center text-xs text-white/70">
                  {stat.label}
                  <Tooltip text={stat.tooltip} />
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <KosovoPulseMap places={featuredPlaces} />
      </div>
    </section>
  );
}
