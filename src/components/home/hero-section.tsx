"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LocateFixed, RadioTower, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { KosovoPulseMap } from "@/components/home/kosovo-pulse-map";
import { buildHeroImageRotation } from "@/components/home/hero-image-rotation";
import { Button } from "@/components/ui/button";
import { experienceCardKeyframes, homePulseCardStyle } from "@/components/ui/experience-card-effects";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { EventDTO, PlaceDTO } from "@/types";

type HeroSectionProps = {
  featuredPlaces: PlaceDTO[];
  featuredEvents?: EventDTO[];
};

export function HeroSection({ featuredPlaces, featuredEvents = [] }: HeroSectionProps) {
  const { t } = useTranslation();
  const { requestLocation, loading, error } = useGeolocation();
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0);
  const heroImages = useMemo(() => {
    return buildHeroImageRotation([...featuredPlaces, ...featuredEvents]);
  }, [featuredEvents, featuredPlaces]);
  const cityCount = useMemo(() => new Set(featuredPlaces.map((place) => place.city).filter(Boolean)).size, [featuredPlaces]);
  const vibeCount = useMemo(
    () => new Set(featuredPlaces.flatMap((place) => place.vibeTags)).size,
    [featuredPlaces]
  );
  const heroStats = [
    { id: "signals", value: String(featuredPlaces.length), label: t("hero.stats.signals"), intensity: 99 },
    { id: "vibes", value: String(vibeCount), label: t("hero.stats.vibes"), intensity: 84 },
    { id: "layers", value: String(cityCount), label: t("hero.stats.layers"), intensity: 78 }
  ];

  useEffect(() => {
    if (heroImages.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveHeroImageIndex((index) => (index + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    setActiveHeroImageIndex((index) => (index >= heroImages.length ? 0 : index));
  }, [heroImages.length]);

  const activeHeroImage = heroImages[activeHeroImageIndex] ?? heroImages[0];

  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <style>{experienceCardKeyframes}</style>
      <AnimatePresence initial={false}>
        <motion.div
          key={activeHeroImage.src}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        >
          <Image
            src={activeHeroImage.src}
            alt=""
            fill
            priority={activeHeroImageIndex === 0}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,23,30,0.82),rgba(24,93,88,0.34),rgba(144,82,53,0.16))]" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/18 via-slate-950/8 to-background" />
      <div className="relative mx-auto grid max-w-7xl gap-8 py-12 lg:min-h-[72svh] lg:grid-cols-[1fr_460px] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.12] px-3 py-1 text-sm backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-teal-200" />
            {t("hero.eyebrow")}
          </div>
          <h1 className="max-w-4xl text-5xl font-black tracking-normal sm:text-6xl lg:text-7xl">{t("hero.title")}</h1>
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

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/78 backdrop-blur-xl">
            <span>{activeHeroImage.label}</span>
            {activeHeroImage.city && <span className="text-white/48">/ {activeHeroImage.city}</span>}
            <span className="text-white/48">{activeHeroImageIndex + 1}/{heroImages.length}</span>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {heroStats.map((stat) => (
              <div
                key={stat.id}
                style={homePulseCardStyle(stat.intensity, hoveredStat === stat.id)}
                className="group relative overflow-hidden rounded-lg border border-white/[0.16] bg-white/[0.12] p-3 backdrop-blur-xl"
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
                onFocus={() => setHoveredStat(stat.id)}
                onBlur={() => setHoveredStat(null)}
                tabIndex={0}
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 origin-left scale-x-0 bg-teal-200 transition-transform duration-300 group-hover:scale-x-100" />
                <span
                  className="pointer-events-none absolute inset-0 z-0 rounded-lg"
                  style={{
                    background:
                      "radial-gradient(circle at 88% 12%, rgb(var(--surge-rgb) / var(--surge-alpha)), transparent 34%)",
                    boxShadow: "inset 0 0 0 1px rgb(var(--surge-rgb) / calc(var(--surge-alpha) * 1.1))",
                    animation: "pulse-card-halo var(--surge-duration) ease-in-out infinite"
                  }}
                />
                <p className="relative z-10 text-2xl font-bold">{stat.value}</p>
                <p className="relative z-10 text-xs text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <KosovoPulseMap places={featuredPlaces} />
      </div>
    </section>
  );
}
