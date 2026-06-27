#!/usr/bin/env node

import { execSync } from "node:child_process";

try {
  const output = execSync("npx prisma migrate status", {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (output.includes("not yet been applied") || output.includes("drift detected")) {
    console.error("ERROR: Unapplied migrations or schema drift detected.");
    console.error(output);
    process.exit(1);
  }

  console.log("Migrations are up to date.");
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("no pending migrations") || message.includes("already been applied")) {
    console.log("Migrations are up to date.");
    process.exit(0);
  }

  console.error("Migration check failed:", message);
  process.exit(1);
}
