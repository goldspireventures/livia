import { initSentry } from "./lib/sentry";
initSentry();

import app from "./app";
import { logger } from "./lib/logger";
import { initTransports } from "./lib/transports";
import { assertProductionEnvAtBoot, warnIfProductionUsesDevUrls } from "./lib/production-env.js";
import {
  getApiPublicUrl,
  getDashboardUrl,
  getInternalUrl,
  getMarketingUrl,
} from "./lib/public-urls.js";

// Wire Twilio + Resend transports if their secrets are present. Absent
// secrets keep the queued-only no-op transports so notificationLogs still
// captures every PENDING outbound message.
initTransports();

assertProductionEnvAtBoot();
warnIfProductionUsesDevUrls({
  dashboard: getDashboardUrl(),
  marketing: getMarketingUrl(),
  api: getApiPublicUrl(),
  internal: getInternalUrl(),
});

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

  void import("./services/workforce-access-grants.service")
    .then(({ refreshCockpitWorkforceGrantsCache }) => refreshCockpitWorkforceGrantsCache())
    .catch((err) => {
      logger.warn({ err }, "workforce access grants cache load failed");
    });

  if (process.env.NODE_ENV === "development") {
    void import("./lib/demo-portal-config")
      .then(({ isDemoPortalEnabled }) => {
        if (!isDemoPortalEnabled()) return null;
        return import("./services/demo-portal.service").then(({ getDemoPortalStatus }) =>
          getDemoPortalStatus(),
        );
      })
      .then((status) => {
        if (!status?.provisioned) return;
        return import("./services/demo-inbox.seed").then(({ ensureMessagingInboxFromPolicy }) =>
          Promise.all(
            status.businesses.map(async (biz) => {
              const v = biz.vertical ?? "beauty";
              if (v !== "beauty" && v !== "wellness" && v !== "hair") return;
              try {
                const repaired = await ensureMessagingInboxFromPolicy(biz.id, v);
                if (repaired) {
                  logger.info({ businessId: biz.id, slug: biz.slug }, "demo.inbox.policy_repaired_on_boot");
                }
              } catch (err) {
                logger.warn({ err, slug: biz.slug }, "demo.inbox.policy_repair_on_boot_failed");
              }
            }),
          ),
        );
      })
      .catch((err) => {
        logger.warn({ err }, "demo inbox policy repair on boot skipped");
      });
  }
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
