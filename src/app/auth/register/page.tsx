"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
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
  const [loading, setLoading] = useState(false);

  const register = async () => {
    setLoading(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setStatus(payload.ok ? t("auth.created") : payload.error);
    setLoading(false);
  };

  return (
    <section className="section-band">
      <div className="page-shell grid min-h-[70vh] place-items-center">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-glass">
          <Badge variant="green" className="mb-4">
            <UserPlus className="mr-1 h-3.5 w-3.5" />
            {t("auth.createAccount")}
          </Badge>
          <h1 className="text-3xl font-bold tracking-normal">{t("auth.registerTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("auth.registerHelp")}
          </p>

          <div className="mt-6 space-y-4">
            <label className="grid gap-2 text-sm font-medium">
              {t("common.name")}
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("common.email")}
              <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("common.password")}
              <Input
                type="password"
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
            <Button className="w-full" size="lg" onClick={register} disabled={loading}>
              <UserPlus className={loading ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
              {t("common.register")}
            </Button>
            {status && <p className="rounded-md bg-muted p-3 text-sm">{status}</p>}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t("auth.alreadyRegistered")}{" "}
            <Link href="/auth/login" className="font-semibold text-primary">
              {t("common.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
