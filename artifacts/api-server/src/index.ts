import { initSentry } from "./lib/sentry";
initSentry();

import app from "./app";
import { logger } from "./lib/logger";
import { initTransports } from "./lib/transports";

// Wire Twilio + Resend transports if their secrets are present. Absent
// secrets keep the queued-only no-op transports so notificationLogs still
// captures every PENDING outbound message.
initTransports();

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
