"use client";

import { motion } from "framer-motion";
import { ArrowRight, LocateFixed, RadioTower, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { KosovoPulseMap } from "@/components/home/kosovo-pulse-map";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";

export function HeroSection() {
  const { t } = useTranslation();
  const { requestLocation, loading, error } = useGeolocation();

  return (
    <section className="relative overflow-hidden bg-kosovo-hero bg-cover bg-center px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/10 to-background" />
      <div className="relative mx-auto grid max-w-7xl gap-8 py-12 lg:min-h-[72svh] lg:grid-cols-[1fr_460px] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-sm backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-teal-200" />
            {t("hero.eyebrow")}
          </div>
          <h1 className="max-w-4xl text-5xl font-black tracking-normal sm:text-6xl lg:text-7xl">{t("hero.title")}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">
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

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ["312+", t("hero.stats.signals")],
              ["7", t("hero.stats.vibes")],
              ["9", t("hero.stats.layers")]
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/15 bg-white/12 p-3 backdrop-blur-xl">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <KosovoPulseMap />
      </div>
    </section>
  );
}
