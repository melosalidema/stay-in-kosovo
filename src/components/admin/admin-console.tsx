"use client";

import { CheckCheck, MapPinned, ShieldCheck, Store, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardMetric } from "@/types";

type AdminData = {
  metrics: DashboardMetric[];
  queues: {
    businesses: Array<{ id: string; name: string; city: string; status: string }>;
    reviews: Array<{ id: string; place: string; risk: string }>;
    locations: Array<{ id: string; title: string; confidence: number }>;
  };
};

const fallbackMetrics: DashboardMetric[] = [
  { label: "Pending businesses", value: "12", delta: "4 need document review", tone: "amber" },
  { label: "Flagged reviews", value: "8", delta: "2 high priority", tone: "rose" },
  { label: "Approved places", value: "284", delta: "+18 this week", tone: "green" },
  { label: "API health", value: "99.8%", delta: "cache hit rate 74%", tone: "blue" }
];

function textKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AdminConsole() {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminData>({
    metrics: fallbackMetrics,
    queues: {
      businesses: [
        { id: "biz-queue-1", name: "Rugova Zipline Tours", city: "Peja", status: "PENDING" },
        { id: "biz-queue-2", name: "Old Bazaar Coffee", city: "Gjakova", status: "PENDING" }
      ],
      reviews: [
        { id: "rev-queue-1", place: "Hatch Prizren", risk: "Possible promotional wording" },
        { id: "rev-queue-2", place: "Brezovica", risk: "Needs photo moderation" }
      ],
      locations: [{ id: "loc-queue-1", title: "Mirusha Waterfalls Trailhead", confidence: 0.87 }]
    }
  });

  useEffect(() => {
    fetch("/api/admin/moderation")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.data) setData(payload.data);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="section-band">
      <div className="page-shell space-y-6">
        <div>
          <Badge variant="rose" className="mb-3">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            {t("admin.badge")}
          </Badge>
          <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">{t("admin.title")}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t("admin.description")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {data.metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                {t(`metrics.labels.${textKey(metric.label)}`, { defaultValue: metric.label })}
              </p>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              <Badge className="mt-3" variant={metric.tone}>
                {t(`metrics.deltas.${textKey(metric.delta)}`, { defaultValue: metric.delta })}
              </Badge>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Queue
            title={t("admin.businessApprovals")}
            icon={Store}
            items={data.queues.businesses.map((item) => ({
              id: item.id,
              title: item.name,
              detail: `${item.city} · ${item.status}`
            }))}
          />
          <Queue
            title={t("admin.reviewModeration")}
            icon={UserCog}
            items={data.queues.reviews.map((item) => ({
              id: item.id,
              title: item.place,
              detail: item.risk
            }))}
          />
          <Queue
            title={t("admin.locationApproval")}
            icon={MapPinned}
            items={data.queues.locations.map((item) => ({
              id: item.id,
              title: item.title,
              detail: t("admin.coordinateConfidence", { value: Math.round(item.confidence * 100) })
            }))}
          />
        </div>
      </div>
    </section>
  );
}

function Queue({
  title,
  icon: Icon,
  items
}: {
  title: string;
  icon: typeof Store;
  items: Array<{ id: string; title: string; detail: string }>;
}) {
  const { t } = useTranslation();

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-glass">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="font-bold">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-md bg-muted p-3">
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm">
                <CheckCheck className="h-3.5 w-3.5" />
                {t("common.approve")}
              </Button>
              <Button size="sm" variant="outline">
                {t("common.review")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
