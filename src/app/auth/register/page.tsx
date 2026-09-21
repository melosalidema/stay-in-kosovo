"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER"
  });
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const register = async () => {
    setLoading(true);
    setFailed(false);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setFailed(!payload.ok);
    setStatus(payload.ok ? t("auth.created") : payload.error);
    setLoading(false);
  };

  return (
    <section className="section-band">
      <div className="page-shell grid min-h-[70vh] place-items-center">
        <div className="w-full max-w-sm">
          <p className="eyebrow">{t("auth.createAccount")}</p>
          <h1 className="display-3 mt-3">{t("auth.registerTitle")}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("auth.registerHelp")}</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void register();
            }}
          >
            <label className="grid gap-2 text-sm font-medium">
              {t("common.name")}
              <Input
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              {t("common.email")}
              <Input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              {t("common.password")}
              <Input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              {t("common.role")}
              <Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t("auth.userRole")}</SelectItem>
                  <SelectItem value="BUSINESS_OWNER">{t("auth.businessOwner")}</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <Button className="w-full" size="lg" type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("common.register")}
            </Button>

            {status && (
              <p className={failed ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{status}</p>
            )}
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {t("auth.alreadyRegistered")}{" "}
            <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("common.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
