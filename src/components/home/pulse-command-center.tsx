"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { places } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { ALL_KOSOVO_CITY, getPlaceCityOptions } from "@/lib/place-options";
import { generateExperiencePulse } from "@/services/pulse-engine";

function vibeLevel(score: number) {
  if (score >= 80) return "surging" as const;
  if (score >= 65) return "high" as const;
  if (score >= 48) return "medium" as const;
  return "low" as const;
}

export function PulseCommandCenter() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const [city, setCity] = useState(ALL_KOSOVO_CITY);

  const cityOptions = useMemo(() => getPlaceCityOptions(places), []);

  const pulse = useMemo(
    () => generateExperiencePulse({ city, dayPart: "EVENING", vibe: "Nightlife" }),
    [city]
  );

  const cityLabel = city === ALL_KOSOVO_CITY ? t("common.allKosovo") : city;
  const headline = t(`pulseHome.headline.${pulse.crowdMode}`, { city: cityLabel });

  const transitLine =
    pulse.transportHealth.averageReliability >= 75
      ? t("pulseHome.transitGood")
      : pulse.transportHealth.averageReliability >= 60
        ? t("pulseHome.transitOkay")
        : t("pulseHome.transitSlow");

  return (
    <section className="section-band section-plain bg-background">
      <div className="page-shell">
        <SectionHeading
          eyebrow={t("pulseHome.eyebrow")}
          title={t("pulseHome.title")}
          description={t("pulseHome.description")}
          action={
            <div className="flex flex-wrap items-center gap-2">
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
              <Button asChild variant="outline" size="sm">
                <Link href="/pulse">
                  {t("pulseHome.openGuide")}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          }
        />

        <div className="mt-9 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div>
            <p className="font-serif text-2xl leading-snug sm:text-[1.75rem]">{headline}</p>

            <ul className="mt-6 divide-y divide-border border-y border-border">
              {pulse.zones.slice(0, 4).map((zone) => (
                <li key={zone.id} className="flex items-start justify-between gap-6 py-4">
                  <div className="min-w-0">
                    <p className="font-medium">{zone.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{zone.summary}</p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-sm text-muted-foreground">
                    {labels.availability(zone.demandLevel)}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm text-muted-foreground">{transitLine}</p>
          </div>

          <div>
            <p className="text-sm font-medium">{t("pulseHome.popularMoods")}</p>
            <ul className="mt-5 space-y-4">
              {pulse.topVibes.slice(0, 5).map((vibe) => (
                <li key={vibe.vibe}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span>{labels.vibe(vibe.vibe)}</span>
                    <span className="text-muted-foreground">{labels.availability(vibeLevel(vibe.score))}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${vibe.score}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
