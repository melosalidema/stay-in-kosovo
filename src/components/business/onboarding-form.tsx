"use client";

import { Building2, LocateFixed, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories, vibes } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { isCoordinateInsideKosovo } from "@/lib/geo";

const adventureVibes = new Set(["Adventure", "Adventure & Trails"]);
const sacredVibes = new Set(["Sacred & Spiritual"]);
const wildlifeVibes = new Set(["Wildlife & Nature"]);

const descriptionPlaceholders: Record<string, string> = {
  Adventure: "Describe the trail, difficulty level, and best season...",
  "Adventure & Trails": "Describe the trail, difficulty level, and best season...",
  "Sacred & Spiritual": "Describe the spiritual significance and visitor etiquette...",
  "Hidden Gems": "Tell us why this place is underrated and how to find it...",
  "Wildlife & Nature": "Describe the habitat, animal encounters, and visitor rules...",
  "Living History": "Describe the story, architecture, and cultural context...",
  "Ottoman Heritage": "Describe the historic details, atmosphere, and best time to visit..."
};

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const numeric = Number.parseInt(value, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function OnboardingForm() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const [selectedVibe, setSelectedVibe] = useState("Local Food");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    city: "Prishtina",
    address: "",
    latitude: "",
    longitude: "",
    categorySlug: "restaurants",
    vibeTags: ["Local Food"],
    trailDifficulty: "",
    elevationGain: "",
    dressCode: "",
    visitingHours: "",
    animalTypes: "",
    entryFee: "",
    phone: "",
    instagram: ""
  });

  const selectedVibeMeta = vibes.find((vibe) => vibe.name === selectedVibe) ?? vibes[0];
  const accentColor = selectedVibeMeta.color;
  const fieldMode = adventureVibes.has(selectedVibe)
    ? "adventure"
    : sacredVibes.has(selectedVibe)
      ? "sacred"
      : wildlifeVibes.has(selectedVibe)
        ? "wildlife"
        : "standard";
  const descriptionPlaceholder =
    descriptionPlaceholders[selectedVibe] ?? t("business.descriptionPlaceholder");
  const themedPanelStyle = {
    background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.14)}, ${hexToRgba(accentColor, 0.04)} 48%, rgba(255, 255, 255, 0.9))`,
    borderColor: hexToRgba(accentColor, 0.42),
    boxShadow: `0 18px 48px ${hexToRgba(accentColor, 0.12)}`
  };

  const submit = async () => {
    const coordinates = {
      lat: Number(form.latitude),
      lng: Number(form.longitude)
    };
    const submission = {
      name: form.name,
      description: form.description,
      city: form.city,
      address: form.address,
      categorySlug: form.categorySlug,
      vibeTags: form.vibeTags,
      phone: form.phone,
      instagram: form.instagram
    };

    if (!isCoordinateInsideKosovo(coordinates)) {
      setStatus(t("business.coordinatesInvalid"));
      return;
    }

    setLoading(true);
    const response = await fetch("/api/businesses/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...submission,
        latitude: coordinates.lat,
        longitude: coordinates.lng
      })
    });
    const payload = await response.json();
    setStatus(payload.ok ? t("business.submitted") : payload.error);
    setLoading(false);
  };

  const fillCurrentLocation = () => {
    setStatus(null);

    if (!navigator.geolocation) {
      setStatus(t("business.geolocationUnavailable"));
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (!isCoordinateInsideKosovo(coordinates)) {
          setStatus(t("business.coordinatesOutside"));
          setLocationLoading(false);
          return;
        }

        setForm((current) => ({
          ...current,
          latitude: coordinates.lat.toFixed(7),
          longitude: coordinates.lng.toFixed(7)
        }));
        setLocationLoading(false);
      },
      () => {
        setStatus(t("business.geolocationDenied"));
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000
      }
    );
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

        <div
          className="rounded-lg border bg-card p-5 shadow-glass transition-[background,border-color,box-shadow] duration-300 ease-in-out"
          style={themedPanelStyle}
        >
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
                placeholder={descriptionPlaceholder}
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
            <div className="grid gap-3 rounded-lg border border-border bg-muted/45 p-3 md:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">{t("business.coordinates")}</p>
                  <p className="text-xs text-muted-foreground">{t("business.coordinatesHelp")}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={fillCurrentLocation} disabled={locationLoading}>
                  <LocateFixed className={locationLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  {t("business.useGpsLocation")}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  {t("business.latitude")}
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.0000001"
                    value={form.latitude}
                    onChange={(event) => setForm({ ...form, latitude: event.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  {t("business.longitude")}
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.0000001"
                    value={form.longitude}
                    onChange={(event) => setForm({ ...form, longitude: event.target.value })}
                  />
                </label>
              </div>
            </div>
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
                  const active = selectedVibe === vibe.name;
                  return (
                    <Button
                      key={vibe.name}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className="transition-[background,border-color,color,box-shadow] duration-300 ease-in-out"
                      style={
                        active
                          ? { backgroundColor: vibe.color, borderColor: vibe.color, color: "#ffffff" }
                          : { borderColor: hexToRgba(vibe.color, 0.34), color: vibe.color }
                      }
                      onClick={() => {
                        setSelectedVibe(vibe.name);
                        setForm({ ...form, vibeTags: [vibe.name] });
                      }}
                    >
                      <span aria-hidden="true">{vibe.emoji}</span>
                      {labels.vibe(vibe.name)}
                    </Button>
                  );
                })}
              </div>
              <div
                className="mt-4 rounded-md border p-3 text-sm transition-[background,border-color,opacity] duration-300 ease-in-out"
                style={{
                  backgroundColor: hexToRgba(accentColor, 0.1),
                  borderColor: hexToRgba(accentColor, 0.32)
                }}
              >
                <p className="flex items-center gap-2 font-semibold">
                  <span aria-hidden="true">{selectedVibeMeta.emoji}</span>
                  {labels.vibe(selectedVibe)}
                </p>
                <p className="mt-1 text-muted-foreground">{labels.vibeDescription(selectedVibe)}</p>
              </div>
            </div>
            {fieldMode === "adventure" && (
              <div
                className="grid gap-3 rounded-lg border p-3 transition-[background,border-color] duration-300 ease-in-out md:col-span-2 md:grid-cols-2"
                style={{ backgroundColor: hexToRgba(accentColor, 0.08), borderColor: hexToRgba(accentColor, 0.28) }}
              >
                <label className="grid gap-2 text-sm font-medium">
                  Trail difficulty
                  <Input
                    value={form.trailDifficulty}
                    onChange={(event) => setForm({ ...form, trailDifficulty: event.target.value })}
                    placeholder="Easy, moderate, or hard"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Elevation gain
                  <Input
                    value={form.elevationGain}
                    onChange={(event) => setForm({ ...form, elevationGain: event.target.value })}
                    placeholder="Example: 450 m"
                  />
                </label>
              </div>
            )}
            {fieldMode === "sacred" && (
              <div
                className="grid gap-3 rounded-lg border p-3 transition-[background,border-color] duration-300 ease-in-out md:col-span-2 md:grid-cols-2"
                style={{ backgroundColor: hexToRgba(accentColor, 0.08), borderColor: hexToRgba(accentColor, 0.28) }}
              >
                <label className="grid gap-2 text-sm font-medium">
                  Dress code
                  <Input
                    value={form.dressCode}
                    onChange={(event) => setForm({ ...form, dressCode: event.target.value })}
                    placeholder="Modest clothing, head covering, shoes"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Visiting hours
                  <Input
                    value={form.visitingHours}
                    onChange={(event) => setForm({ ...form, visitingHours: event.target.value })}
                    placeholder="Example: 09:00-17:00"
                  />
                </label>
              </div>
            )}
            {fieldMode === "wildlife" && (
              <div
                className="grid gap-3 rounded-lg border p-3 transition-[background,border-color] duration-300 ease-in-out md:col-span-2 md:grid-cols-2"
                style={{ backgroundColor: hexToRgba(accentColor, 0.08), borderColor: hexToRgba(accentColor, 0.28) }}
              >
                <label className="grid gap-2 text-sm font-medium">
                  Animal types
                  <Input
                    value={form.animalTypes}
                    onChange={(event) => setForm({ ...form, animalTypes: event.target.value })}
                    placeholder="Example: rescued brown bears"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Entry fee
                  <Input
                    value={form.entryFee}
                    onChange={(event) => setForm({ ...form, entryFee: event.target.value })}
                    placeholder="Example: EUR 2 adult ticket"
                  />
                </label>
              </div>
            )}
          </div>
          <Button
            className="mt-6 text-white transition-[background,box-shadow,opacity] duration-300 ease-in-out hover:opacity-90"
            size="lg"
            style={{ backgroundColor: accentColor, boxShadow: `0 12px 30px ${hexToRgba(accentColor, 0.26)}` }}
            onClick={submit}
            disabled={loading}
          >
            <Send className={loading ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
            {t("business.submitApproval")}
          </Button>
          {status && <p className="mt-4 rounded-md bg-muted p-3 text-sm">{status}</p>}
        </div>
      </div>
    </section>
  );
}
