"use client";

import { BarChart3, CalendarPlus, CheckCircle2, ImagePlus, QrCode, Rocket, Settings, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMetric } from "@/types";

type DashboardPayload = {
  profile: {
    name: string;
    status: string;
    visibility: string;
  };
  metrics: DashboardMetric[];
  boostSystem: {
    score: number;
    contributors: string[];
  };
};

const fallbackMetrics: DashboardMetric[] = [
  { label: "Discovery views", value: "18.4K", delta: "+22% vs last month", tone: "green" },
  { label: "Route requests", value: "812", delta: "+14% from mobility", tone: "blue" },
  { label: "Saved by users", value: "1.4K", delta: "+9% from AI picks", tone: "amber" },
  { label: "Check-ins", value: "436", delta: "+31% QR flow", tone: "rose" }
];

function textKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function BusinessDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardPayload>({
    profile: {
      name: "Soma Book Station",
      status: "APPROVED",
      visibility: "Boosted in Chill, Local Food, and Hidden Gems"
    },
    metrics: fallbackMetrics,
    boostSystem: {
      score: 74,
      contributors: ["Complete profile", "High review quality", "Recent events", "Fast route response"]
    }
  });

  useEffect(() => {
    fetch("/api/businesses")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.data) setData(payload.data);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="section-band">
      <div className="page-shell space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="green" className="mb-3">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              {t("business.dashboardBadge")}
            </Badge>
            <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">{data.profile.name}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {data.profile.visibility === "Boosted in Chill, Local Food, and Hidden Gems"
                ? t("business.visibility")
                : data.profile.visibility}
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/business/onboarding">
              <Settings className="h-4 w-4" />
              {t("business.onboardAnother")}
            </a>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {data.metrics.map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {t(`metrics.labels.${textKey(metric.label)}`, { defaultValue: metric.label })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metric.value}</p>
                <Badge variant={metric.tone} className="mt-3">
                  {t(`metrics.deltas.${textKey(metric.delta)}`, { defaultValue: metric.delta })}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <Rocket className="h-5 w-5 text-primary" />
                <h2 className="font-bold">{t("business.boostTitle")}</h2>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${data.boostSystem.score}%` }} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("business.boostText")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.boostSystem.contributors.map((item) => (
                  <Badge key={item} variant="outline">
                    {t(`business.contributors.${data.boostSystem.contributors.indexOf(item)}`, { defaultValue: item })}
                  </Badge>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <CalendarPlus className="h-5 w-5 text-primary" />
                <h2 className="font-bold">{t("business.eventManager")}</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="rounded-md bg-muted p-3">
                  <p className="font-semibold">{t("business.event1Title")}</p>
                  <p className="text-muted-foreground">{t("business.event1Meta")}</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="font-semibold">{t("business.event2Title")}</p>
                  <p className="text-muted-foreground">{t("business.event2Meta")}</p>
                </div>
              </div>
              <Button className="mt-4" variant="outline">
                {t("business.addEvent")}
              </Button>
            </article>

            <article className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <ImagePlus className="h-5 w-5 text-primary" />
                <h2 className="font-bold">{t("business.photosMedia")}</h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("business.photosText")}
              </p>
              <Button className="mt-4" variant="outline">
                {t("business.requestUpload")}
              </Button>
            </article>

            <article className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <QrCode className="h-5 w-5 text-primary" />
                <h2 className="font-bold">{t("business.qrTitle")}</h2>
              </div>
              <div className="grid aspect-square max-w-40 place-items-center rounded-lg border border-border bg-muted text-center text-xs text-muted-foreground">
                STAY-KOSOVO
                <br />
                QR-CHECKIN
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("business.qrText")}
              </p>
            </article>
          </div>

          <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-glass">
            <p className="mb-4 flex items-center gap-2 font-bold">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t("business.funnel")}
            </p>
            <div className="space-y-3">
              {["18.4K", "4.2K", "812", "226", "436"].map((value, index) => (
                <div key={`${value}-${index}`} className="flex items-center justify-between rounded-md bg-muted p-3 text-sm">
                  <span>{t(`business.funnelItems.${index}`)}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t("business.analyticsText")}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
