import { Writable } from "node:stream";
import pino, { type LoggerOptions } from "pino";

function parseLokiLabels(): Record<string, string> {
  const labels: Record<string, string> = {
    service: "api-server",
    env: process.env.NODE_ENV ?? "development",
  };
  for (const part of (process.env.LOKI_LABELS ?? "").split(",")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (k && v) labels[k] = v;
  }
  return labels;
}

function createLokiPushStream(pushUrl: string, labels: Record<string, string>): Writable {
  const batch: string[] = [];
  const flush = () => {
    if (batch.length === 0) return;
    const values = batch.splice(0, batch.length).map((line) => [`${Date.now()}000000`, line]);
    fetch(pushUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streams: [{ stream: labels, values }] }),
    }).catch(() => undefined);
  };
  const timer = setInterval(flush, 2000).unref();
  return new Writable({
    write(chunk, _enc, cb) {
      const line = chunk.toString().trim();
      if (line) {
        batch.push(line);
        if (batch.length >= 32) flush();
      }
      cb();
    },
    final(cb) {
      flush();
      clearInterval(timer);
      cb();
    },
  });
}

/** When LOKI_PUSH_URL is set, duplicate JSON logs to Loki (stdout remains for scrapers). */
export function buildLoggerOptions(): Partial<LoggerOptions> {
  const pushUrl = process.env.LOKI_PUSH_URL?.trim();
  if (!pushUrl) return {};

  const loki = createLokiPushStream(pushUrl, parseLokiLabels());
  return {
    stream: pino.multistream([
      { stream: process.stdout },
      { stream: loki },
    ]),
  } as Partial<LoggerOptions>;
}
