import { loadEnvConfig } from "@next/env";
import { z } from "zod";

import { logger } from "@/lib/logger";

loadEnvConfig(process.cwd());

/**
 * Environment schema.
 *
 * Everything here is optional or defaulted on purpose. A build must never fail
 * because a *runtime* secret is absent: Netlify runs `next build` before the
 * site has any traffic, and secrets like NEXTAUTH_SECRET are only read when a
 * request actually needs them. Requiring them here turned a missing dashboard
 * variable into a hard build failure, which is the wrong place to find out.
 *
 * Missing production values are reported once, loudly, by `reportEnvWarnings`
 * below. The app then degrades the way the rest of the codebase already does:
 * no secret means no sign-in, and everything else keeps working.
 */
const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET should be at least 16 characters.").optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional()
});

export type AppEnv = z.infer<typeof envSchema>;

const FALLBACK_ENV: AppEnv = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  OPENAI_MODEL: "gpt-4.1-mini"
};

const result = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
});

if (!result.success) {
  // Only reachable if a defaulted field itself is invalid, which would be a bug
  // in this file rather than a deployment mistake. Say so, then carry on.
  logger.warn(
    { issues: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) },
    "Environment values were rejected; using defaults"
  );
}

export const env: AppEnv = result.success ? result.data : FALLBACK_ENV;

/**
 * What is missing, what breaks, and how to fix it. Logged once per process so
 * a misconfigured deploy is obvious in the Netlify function logs without
 * spamming every request.
 */
const RUNTIME_REQUIREMENTS: Array<{ key: keyof AppEnv; impact: string }> = [
  { key: "DATABASE_URL", impact: "places come from the bundled dataset; nothing is saved and sign-in is unavailable" },
  { key: "NEXTAUTH_SECRET", impact: "sign-in fails with NextAuth's NO_SECRET error" }
];

let warningsReported = false;

export function reportEnvWarnings() {
  if (warningsReported) return;
  warningsReported = true;

  if (process.env.NODE_ENV !== "production") return;

  const missing = RUNTIME_REQUIREMENTS.filter(({ key }) => !process.env[key as string]);

  if (!missing.length) {
    logger.info({ url: process.env.NEXTAUTH_URL ?? env.NEXT_PUBLIC_APP_URL }, "Environment looks complete");
    return;
  }

  logger.warn(
    {
      missing: missing.map((entry) => entry.key),
      impact: missing.map((entry) => `${entry.key}: ${entry.impact}`)
    },
    "Required environment variables are not set — the app will run in a degraded mode"
  );
}

reportEnvWarnings();
