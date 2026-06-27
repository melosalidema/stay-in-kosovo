import pino from "pino";

const isDev = process.env.NODE_ENV === "development";
const isPerfLogs = process.env.PERF_LOGS === "1";

export const logger = pino({
  level: isDev || isPerfLogs ? "debug" : "info",
  ...(isDev
    ? {
        transport: {
          target: "pino/file",
          options: { destination: 1 }
        }
      }
    : {}),
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "body.password", "body.token"],
    censor: "[REDACTED]"
  }
});

export function createRequestLogger(request: Request) {
  const url = new URL(request.url);

  return logger.child({
    method: request.method,
    path: url.pathname,
    query: url.search
  });
}
