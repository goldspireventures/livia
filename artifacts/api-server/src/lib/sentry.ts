import * as Sentry from "@sentry/node";
import { logger } from "./logger";

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN_API;
  if (!dsn) {
    logger.info("Sentry disabled (SENTRY_DSN_API not set)");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE ?? process.env.REPL_DEPLOYMENT_ID ?? undefined,
    tracesSampleRate: 0,
  });

  initialized = true;
  logger.info({ environment: process.env.NODE_ENV }, "Sentry initialised (api-server)");
}

export { Sentry };
