"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowUpRight, RadioTower, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { places } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { ALL_KOSOVO_CITY, getPlaceCityOptions } from "@/lib/place-options";
import { cn } from "@/lib/utils";
import { generateExperiencePulse } from "@/services/pulse-engine";

export function PulseCommandCenter() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const [city, setCity] = useState(ALL_KOSOVO_CITY);
  const [showDetails, setShowDetails] = useState(false);

  const cityOptions = useMemo(() => getPlaceCityOptions(places), []);

  const pulse = useMemo(
    () => generateExperiencePulse({ city, dayPart: "EVENING", vibe: "Nightlife" }),
    [city]
  );

  const cityLabel = city === ALL_KOSOVO_CITY ? t("common.allKosovo") : city;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="section-band !py-10"
    >
      <div className="page-shell space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="blue" className="mb-3">
              <RadioTower className="mr-1 h-3.5 w-3.5" />
              {t("pulseHome.badge")}
            </Badge>
            <h2 className="text-3xl font-bold tracking-normal sm:text-4xl">
              {t("pulseHome.title")}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_KOSOVO_CITY}>{t("common.allKosovo")}</SelectItem>
                {cityOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="outline">
              <Link href="/pulse">
                {t("pulseHome.openConsole")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {pulse.insights.map((insight) => (
            <article key={insight.label} className="experience-card-home p-4">
              <p className="text-sm text-muted-foreground">{insight.label}</p>
              <p className="mt-2 text-3xl font-bold">{insight.value}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
            </article>
          ))}
        </div>

        <div className="experience-card-home p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary/[0.1]">
                <Activity className="h-6 w-6 text-primary" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">
                  {city === ALL_KOSOVO_CITY
                    ? t("pulseHome.tonightAcrossKosovo")
                    : t("pulseHome.tonightIn", { city: cityLabel })}
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-black tracking-normal">{pulse.liveScore}</p>
                  <Tooltip text={t("pulseHome.liveScoreTip")} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-muted-foreground">{t("pulseHome.transit", { value: pulse.transportHealth.averageReliability })}</p>
                <p className="text-xs text-muted-foreground">
                  {t("pulseHome.transportLabel")}
                  <Tooltip text={t("pulseHome.transportTip")} />
                </p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-muted-foreground">{labels.availability(pulse.crowdMode)}</p>
                <p className="text-xs text-muted-foreground">
                  {t("pulseHome.crowdLabel")}
                  <Tooltip text={t("pulseHome.crowdTip")} />
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  {pulse.topVibes.slice(0, 4).map((vibe) => (
                    <motion.div
                      key={vibe.vibe}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-md border border-border bg-muted/[0.4] p-3"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span>{labels.vibe(vibe.vibe)}</span>
                        <span className="font-mono font-bold">{vibe.score}</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-primary/60"
                          initial={{ width: 0 }}
                          animate={{ width: `${vibe.score}%` }}
                          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails((v) => !v)}
            >
              {showDetails
                ? t("pulseHome.hideDetails")
                : t("pulseHome.showDetails")}
            </Button>
          </div>
        </div>

        <p className={cn("flex items-start gap-2 text-center text-sm text-muted-foreground", !showDetails && !pulse.topVibes.length && "hidden")}>
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {t("pulseHome.note")}
        </p>
      </div>
    </motion.section>
  );
}
