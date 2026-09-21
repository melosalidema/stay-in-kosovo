"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chrome } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const APP_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

function isValidRedirect(next: string | null): string {
  if (!next || next === "/") return "/";
  try {
    const url = new URL(next, APP_ORIGIN);
    if (url.origin !== APP_ORIGIN) return "/";
    return url.pathname + url.search;
  } catch {
    return "/";
  }
}

export default function LoginPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const next = isValidRedirect(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: next
    });

    if (result?.error) {
      setError(t("auth.loginFailed"));
      setLoading(false);
      return;
    }

    window.location.href = result?.url ?? next;
  };

  return (
    <section className="section-band">
      <div className="page-shell grid min-h-[70vh] place-items-center">
        <div className="w-full max-w-sm">
          <p className="eyebrow">{t("auth.protectedRoutes")}</p>
          <h1 className="display-3 mt-3">{t("auth.loginTitle")}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("auth.loginHelp")}</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void login();
            }}
          >
            <label className="grid gap-2 text-sm font-medium">
              {t("common.email")}
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              {t("common.password")}
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <Button className="w-full" size="lg" type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("common.signIn")}
            </Button>

            <Button
              className="w-full"
              type="button"
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: next })}
            >
              <Chrome className="h-4 w-4" aria-hidden="true" />
              {t("auth.google")}
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {t("auth.newAccount")}{" "}
            <Link href="/auth/register" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("auth.createAccount")}
            </Link>
          </p>

          <p className="mt-8 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">{t("auth.seeded")}</p>
        </div>
      </div>
    </section>
  );
}
