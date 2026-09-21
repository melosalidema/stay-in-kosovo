import pino, { type DestinationStream } from "pino";

const isDev = process.env.NODE_ENV === "development";
const isPerfLogs = process.env.PERF_LOGS === "1";

const stream = pino.destination({ dest: 1, sync: false });

stream.on("error", () => {
  // A failing log stream must never take down the server.
});

const destination: DestinationStream = {
  write(chunk: string) {
    try {
      stream.write(chunk);
    } catch {
      // Logging failures are never fatal.
    }
  }
};

export const logger = pino(
  {
    level: isDev || isPerfLogs ? "debug" : "info",
    formatters: {
      level(label) {
        return { level: label };
      }
    },
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie", "body.password", "body.token"],
      censor: "[REDACTED]"
    }
  },
  destination
);

export function createRequestLogger(request: Request) {
  const url = new URL(request.url);

  return logger.child({
    method: request.method,
    path: url.pathname,
    query: url.search
  });
}
