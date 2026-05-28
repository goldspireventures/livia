import { initSentry } from "./lib/sentry";
initSentry();

import app from "./app";
import { logger } from "./lib/logger";
import { initTransports } from "./lib/transports";

// Wire Twilio + Resend transports if their secrets are present. Absent
// secrets keep the queued-only no-op transports so notificationLogs still
// captures every PENDING outbound message.
initTransports();

if (process.env.NODE_ENV !== "test") {
  void import("./services/liv-tool-catalog.service")
    .then(({ syncLivToolCatalogFromRegistry }) => syncLivToolCatalogFromRegistry())
    .catch((err) => {
      logger.warn({ err }, "liv tool catalog sync on boot failed");
    });

  void import("./services/internal-ops-alerts.service")
    .then(({ seedInternalOpsMonitoringDefaults }) => seedInternalOpsMonitoringDefaults())
    .catch((err) => {
      logger.warn({ err }, "internal ops monitoring defaults seed failed");
    });
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
