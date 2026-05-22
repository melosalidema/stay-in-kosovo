"use client";

import { Building2, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories, vibes } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";

export function OnboardingForm() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    city: "Prishtina",
    address: "",
    categorySlug: "restaurants",
    vibeTags: ["Local Food"],
    phone: "",
    instagram: ""
  });

  const submit = async () => {
    setLoading(true);
    const response = await fetch("/api/businesses/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setStatus(payload.ok ? t("business.submitted") : payload.error);
    setLoading(false);
  };

  return (
    <section className="section-band">
      <div className="page-shell grid gap-6 lg:grid-cols-[420px_1fr]">
        <aside>
          <Badge variant="green" className="mb-3">
            <Building2 className="mr-1 h-3.5 w-3.5" />
            {t("business.onboardingBadge")}
          </Badge>
          <h1 className="text-3xl font-bold tracking-normal">{t("business.onboardingTitle")}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("business.onboardingText")}
          </p>
        </aside>

        <div className="rounded-lg border border-border bg-card p-5 shadow-glass">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {t("business.businessName")}
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {t("common.description")}
              <Textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder={t("business.descriptionPlaceholder")}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("common.city")}
              <Select value={form.city} onValueChange={(city) => setForm({ ...form, city })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Prishtina", "Prizren", "Peja", "Gjakova", "Brezovica"].map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("common.category")}
              <Select value={form.categorySlug} onValueChange={(categorySlug) => setForm({ ...form, categorySlug })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {labels.category(category.slug)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {t("common.address")}
              <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("common.phone")}
              <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("common.instagram")}
              <Input value={form.instagram} onChange={(event) => setForm({ ...form, instagram: event.target.value })} />
            </label>
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium">{t("business.vibeTags")}</p>
              <div className="flex flex-wrap gap-2">
                {vibes.map((vibe) => {
                  const active = form.vibeTags.includes(vibe.name);
                  return (
                    <Button
                      key={vibe.name}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setForm({
                          ...form,
                          vibeTags: active
                            ? form.vibeTags.filter((tag) => tag !== vibe.name)
                            : [...form.vibeTags, vibe.name]
                        })
                      }
                    >
                      {labels.vibe(vibe.name)}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <Button className="mt-6" size="lg" onClick={submit} disabled={loading}>
            <Send className={loading ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
            {t("business.submitApproval")}
          </Button>
          {status && <p className="mt-4 rounded-md bg-muted p-3 text-sm">{status}</p>}
        </div>
      </div>
    </section>
  );
}
