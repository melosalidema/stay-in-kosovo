"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chrome, LogIn } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("tourist@staykosovo.dev");
  const [password, setPassword] = useState("Password123!");
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
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-glass">
          <Badge variant="blue" className="mb-4">
            <LogIn className="mr-1 h-3.5 w-3.5" />
            {t("auth.protectedRoutes")}
          </Badge>
          <h1 className="text-3xl font-bold tracking-normal">{t("auth.loginTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("auth.loginHelp")}
          </p>

          <div className="mt-6 space-y-4">
            <label className="grid gap-2 text-sm font-medium">
              {t("common.email")}
              <Input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("common.password")}
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <Button className="w-full" size="lg" onClick={login} disabled={loading}>
              <LogIn className={loading ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
              {t("common.login")}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => signIn("google", { callbackUrl: next })}>
              <Chrome className="h-4 w-4" />
              {t("auth.google")}
            </Button>
            {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </div>

          <div className="mt-6 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {t("auth.seeded")}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("auth.newAccount")}{" "}
            <Link href="/auth/register" className="font-semibold text-primary">
              {t("common.register")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
