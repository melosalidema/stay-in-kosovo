"use client";

import { Camera, MessageSquareText, Music, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { places } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";

const atmosphereTags = ["warm", "local", "creative", "quiet", "lively", "romantic", "family", "scenic"];

export function ReviewComposer() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const [form, setForm] = useState({
    placeId: places[1].slug,
    rating: 5,
    comment: "",
    atmosphereTags: ["local"],
    crowdLevel: "Lively",
    musicVibe: "Indie",
    localPopularity: "High"
  });
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setStatus(payload.ok ? t("reviews.success") : payload.error);
  };

  return (
    <section className="section-band bg-muted/30">
      <div className="page-shell grid gap-6 lg:grid-cols-[360px_1fr]">
        <div>
          <Badge variant="blue" className="mb-3">
            <MessageSquareText className="mr-1 h-3.5 w-3.5" />
            {t("reviews.badge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-normal">{t("reviews.title")}</h2>
          <p className="mt-3 text-muted-foreground">
            {t("reviews.description")}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-glass">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              {t("common.place")}
              <Select value={form.placeId} onValueChange={(placeId) => setForm({ ...form, placeId })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {places.map((place) => (
                    <SelectItem key={place.id} value={place.slug}>
                      {place.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("common.rating")}
              <Input
                type="number"
                min={1}
                max={5}
                value={form.rating}
                onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {t("reviews.commentLabel")}
              <Textarea
                value={form.comment}
                onChange={(event) => setForm({ ...form, comment: event.target.value })}
                placeholder={t("reviews.commentPlaceholder")}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {t("reviews.crowdLevel")}
              </span>
              <Select value={form.crowdLevel} onValueChange={(crowdLevel) => setForm({ ...form, crowdLevel })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Quiet", "Balanced", "Lively", "Busy", "Seasonal"].map((level) => (
                    <SelectItem key={level} value={level}>
                      {labels.crowd(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" />
                {t("reviews.musicVibe")}
              </span>
              <Input value={form.musicVibe} onChange={(event) => setForm({ ...form, musicVibe: event.target.value })} />
            </label>
            <div className="md:col-span-2">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Camera className="h-4 w-4 text-primary" />
                {t("reviews.atmosphereTags")}
              </p>
              <div className="flex flex-wrap gap-2">
                {atmosphereTags.map((tag) => {
                  const active = form.atmosphereTags.includes(tag);
                  return (
                    <Button
                      key={tag}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setForm({
                          ...form,
                          atmosphereTags: active
                            ? form.atmosphereTags.filter((item) => item !== tag)
                            : [...form.atmosphereTags, tag]
                        })
                      }
                    >
                      {labels.atmosphere(tag)}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <Button className="mt-6" onClick={submit}>
            {t("reviews.submit")}
          </Button>
          {status && <p className="mt-4 rounded-md bg-muted p-3 text-sm">{status}</p>}
        </div>
      </div>
    </section>
  );
}
