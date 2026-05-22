import { Prisma, PrismaClient } from "@prisma/client";

import { startEventLoopMonitor } from "@/lib/performance";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaQueryLoggingAttached?: boolean;
};

type PrismaQueryEvent = {
  query: string;
  params: string;
  duration: number;
};

type PrismaQueryLogger = {
  $on(event: "query", callback: (event: PrismaQueryEvent) => void): void;
};

const prismaLogConfig: Prisma.PrismaClientOptions["log"] =
  process.env.PERF_LOGS === "1"
    ? [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "error" },
        { emit: "stdout", level: "warn" }
      ]
    : process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLogConfig
  });

if (process.env.PERF_LOGS === "1" && !globalForPrisma.prismaQueryLoggingAttached) {
  (prisma as unknown as PrismaQueryLogger).$on("query", (event) => {
    const query = event.query.replace(/\s+/g, " ").slice(0, 320);
    console.warn(`[perf] prisma query durationMs=${event.duration} query="${query}" params=${event.params}`);
  });
  globalForPrisma.prismaQueryLoggingAttached = true;
}

startEventLoopMonitor();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
