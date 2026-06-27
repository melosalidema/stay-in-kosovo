import { AsyncLocalStorage } from "node:async_hooks";
import { monitorEventLoopDelay } from "node:perf_hooks";

import { logger } from "@/lib/logger";

type TimingStep = {
  name: string;
  durationMs: number;
};

type TimingContext = {
  route: string;
  startedAt: number;
  steps: TimingStep[];
};

type RouteHandler<Args extends unknown[]> = (...args: Args) => Response | Promise<Response>;

const timingStore = new AsyncLocalStorage<TimingContext>();
const slowRequestMs = Number(process.env.PERF_SLOW_MS ?? 250);
const slowStepMs = Number(process.env.PERF_STEP_SLOW_MS ?? 100);
const perfLogsEnabled = process.env.PERF_LOGS === "1" || process.env.NODE_ENV === "development";

let eventLoopMonitorStarted = false;

function duration(startedAt: number) {
  return Number((performance.now() - startedAt).toFixed(1));
}

function sanitizeServerTimingName(name: string) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 48);
}

function logSlowStep(route: string, step: TimingStep) {
  if (!perfLogsEnabled || step.durationMs < slowStepMs) return;
  logger.warn({ route, step: step.name, durationMs: step.durationMs }, "slow step");
}

function logRoute(context: TimingContext, totalMs: number) {
  if (!perfLogsEnabled || totalMs < slowRequestMs) return;

  const steps = context.steps
    .map((step) => `${step.name}:${step.durationMs.toFixed(1)}ms`)
    .join(" ");

  logger.warn({ route: context.route, totalMs: totalMs.toFixed(1), steps }, "slow route");
}

export async function timeStep<T>(name: string, work: () => T | Promise<T>): Promise<T> {
  const startedAt = performance.now();

  try {
    return await work();
  } finally {
    const context = timingStore.getStore();
    const step = { name, durationMs: duration(startedAt) };

    if (context) {
      context.steps.push(step);
      logSlowStep(context.route, step);
    } else if (perfLogsEnabled && step.durationMs >= slowStepMs) {
      logger.warn({ step: step.name, durationMs: step.durationMs }, "slow step (no context)");
    }
  }
}

export function withApiTiming<Args extends unknown[]>(route: string, handler: RouteHandler<Args>): RouteHandler<Args> {
  return async (...args: Args) => {
    const context: TimingContext = {
      route,
      startedAt: performance.now(),
      steps: []
    };

    return timingStore.run(context, async () => {
      const response = await handler(...args);
      const totalMs = duration(context.startedAt);
      logRoute(context, totalMs);

      if (process.env.NODE_ENV !== "production") {
        const serverTiming = [
          `total;dur=${totalMs.toFixed(1)}`,
          ...context.steps.map((step) => `${sanitizeServerTimingName(step.name)};dur=${step.durationMs.toFixed(1)}`)
        ].join(", ");

        response.headers.set("Server-Timing", serverTiming);
        response.headers.set("X-Response-Time", `${totalMs.toFixed(1)}ms`);
      }

      return response;
    });
  };
}

export function startEventLoopMonitor() {
  if (eventLoopMonitorStarted || !perfLogsEnabled) return;
  eventLoopMonitorStarted = true;

  const histogram = monitorEventLoopDelay({ resolution: 20 });
  histogram.enable();

  const interval = setInterval(() => {
    const maxMs = histogram.max / 1_000_000;
    const p99Ms = histogram.percentile(99) / 1_000_000;

    if (maxMs >= Number(process.env.PERF_EVENT_LOOP_SLOW_MS ?? 80)) {
      logger.warn({ maxMs: maxMs.toFixed(1), p99Ms: p99Ms.toFixed(1) }, "event-loop-lag");
    }

    histogram.reset();
  }, 10_000);

  interval.unref();
}
