import { Router, type IRouter } from "express";
import { requireInternalOps } from "../lib/internal-ops-auth";
import {
  getInternalTenantDetail,
  searchInternalTenants,
  buildSupportContext,
} from "../services/internal-ops.service";
import { requireInternalOpsMutation, getInternalOpsOperator } from "../lib/internal-ops-rbac";
import {
  getInternalSupportTicket,
  getLivIncidentBundleForTicket,
  listInternalSupportTickets,
  patchInternalSupportTicket,
} from "../services/internal-support-tickets.service";
import { handleInternalLivAssist } from "../services/internal-liv.service";
import { getInternalPlatformHealth } from "../services/internal-platform.service";
import {
  backfillDemoPlatformLegal,
  ensureDemoOpsReadiness,
  getPlatformObservability,
  runInternalStressProbes,
} from "../services/internal-observability.service";
import {
  getDataFlowStatus,
  getInternalOpsOnboardingChecklist,
  getMonitoringOverview,
  getMonitoringTimeSeries,
  queryExternalLogsForOps,
  searchPlatformLogs,
} from "../services/internal-monitoring.service";
import {
  acknowledgeAlertFiring,
  createAlertRule,
  createSavedLogSearch,
  deleteSavedLogSearch,
  evaluateAlertRules,
  getMonitoringReport,
  listAlertFirings,
  listAlertRules,
  listGrafanaPanels,
  listSavedLogSearches,
  patchAlertRule,
  resolveAlertFiring,
  seedInternalOpsMonitoringDefaults,
} from "../services/internal-ops-alerts.service";
import { listPlatformContinuityTraces } from "../services/internal-continuity-traces.service";
import { traceByRequestId } from "../services/internal-request-trace.service";
import {
  getCompanyDocsIndex,
  listCompanyDocs,
  readCompanyDoc,
} from "../services/company-docs.service";
import { listVerticalCoverageForOps } from "../services/persona-reports.service";
import {
  listInternalFeatureFlags,
  upsertInternalFeatureFlag,
  searchBusinessesForFlags,
} from "../services/internal-feature-flags.service";
import { buildWeeklyPlatformReport } from "../services/internal-weekly-report.service";
import {
  recordImpersonationIntent,
  internalSsoStatus,
} from "../services/internal-impersonation.service";
import { getOrgAdminCockpitSnapshot } from "../services/internal-founder-cockpit.service";
import { runExecAutomation } from "../services/founder-cockpit-automations.service";
import {
  grantCockpitWorkforceAccess,
  listCockpitWorkforceAccessGrants,
  resolveWorkforceAccessTierForEmail,
  revokeCockpitWorkforceAccess,
} from "../services/workforce-access-grants.service";
import { logRouteError, safeClientMessage, sendError } from "../lib/http-errors";

const router: IRouter = Router();

// Scope auth to operator paths only — a bare router.use() would run on every /api request.
router.use("/internal/ops", requireInternalOps);

router.get("/internal/ops/tenants", async (req, res): Promise<void> => {
  const { q, limit, offset } = req.query;
  const result = await searchInternalTenants({
    q: typeof q === "string" ? q : undefined,
    limit: limit ? parseInt(String(limit), 10) : undefined,
    offset: offset ? parseInt(String(offset), 10) : undefined,
  });
  res.json(result);
});

router.get("/internal/ops/tenants/:businessId", async (req, res): Promise<void> => {
  const businessId = Array.isArray(req.params.businessId)
    ? req.params.businessId[0]
    : req.params.businessId;
  const detail = await getInternalTenantDetail(businessId);
  if (!detail) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  res.json(detail);
});

router.get("/internal/ops/support-tickets", async (req, res): Promise<void> => {
  const q = req.query;
  const result = await listInternalSupportTickets({
    status: typeof q.status === "string" ? q.status : undefined,
    category: typeof q.category === "string" ? q.category : undefined,
    priority: typeof q.priority === "string" ? q.priority : undefined,
    assignedTo: typeof q.assignedTo === "string" ? q.assignedTo : undefined,
    businessId: typeof q.businessId === "string" ? q.businessId : undefined,
    q: typeof q.q === "string" ? q.q : undefined,
    limit: q.limit ? parseInt(String(q.limit), 10) : 100,
    offset: q.offset ? parseInt(String(q.offset), 10) : 0,
  });
  res.json(result);
});

router.get("/internal/ops/support-tickets/:ticketId", async (req, res): Promise<void> => {
  const ticketId = Array.isArray(req.params.ticketId)
    ? req.params.ticketId[0]
    : req.params.ticketId;
  const ticket = await getInternalSupportTicket(ticketId);
  if (!ticket) {
    sendError(res, req, 404, "Ticket not found");
    return;
  }
  res.json(ticket);
});

router.get("/internal/ops/support-tickets/:ticketId/liv-incident", async (req, res): Promise<void> => {
  const ticketId = Array.isArray(req.params.ticketId)
    ? req.params.ticketId[0]
    : req.params.ticketId;
  const bundle = await getLivIncidentBundleForTicket(ticketId);
  if (!bundle) {
    sendError(res, req, 404, "Ticket not found");
    return;
  }
  res.json(bundle);
});

router.patch(
  "/internal/ops/support-tickets/:ticketId",
  requireInternalOpsMutation("support_l1"),
  async (req, res): Promise<void> => {
    const ticketId = Array.isArray(req.params.ticketId)
      ? req.params.ticketId[0]
      : req.params.ticketId;
    const operator = getInternalOpsOperator(req);
    const body = req.body ?? {};
    const status = body.status as string | undefined;
    if (
      status &&
      (status === "resolved" || status === "closed") &&
      operator.role !== "exec" &&
      operator.role !== "engineer" &&
      operator.role !== "support_l2"
    ) {
      sendError(res, req, 403, "Resolving tickets requires support_l2 or higher");
      return;
    }
    try {
      const updated = await patchInternalSupportTicket(ticketId, operator, {
        status: status as "open" | "triaged" | "resolved" | "closed" | undefined,
        assignedTo:
          body.assignedTo === null
            ? null
            : typeof body.assignedTo === "string"
              ? body.assignedTo
              : undefined,
        note: typeof body.note === "string" ? body.note : undefined,
        reTriage: body.reTriage === true,
      });
      if (!updated) {
        sendError(res, req, 404, "Ticket not found");
        return;
      }
      res.json(updated);
    } catch (err) {
      const e = err as Error & { status?: number; code?: string };
      if (e.status === 400) {
        sendError(res, req, 400, e.message, { code: e.code });
        return;
      }
      logRouteError(req, err, "Patch support ticket failed");
      sendError(res, req, 500, safeClientMessage(err, "Update failed"));
    }
  },
);

router.get("/internal/ops/tenants/:businessId/support-context", async (req, res): Promise<void> => {
  const businessId = Array.isArray(req.params.businessId)
    ? req.params.businessId[0]
    : req.params.businessId;
  const ctx = await buildSupportContext(businessId);
  if (!ctx) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  res.json(ctx);
});

router.get("/internal/ops/platform-health", async (_req, res): Promise<void> => {
  res.json(await getInternalPlatformHealth());
});

/** Exec command center — prefer this path; unguessable surface for solo operator. */
router.get(
  "/internal/ops/exec/snapshot",
  requireInternalOpsMutation("exec"),
  async (_req, res): Promise<void> => {
    res.json(await getOrgAdminCockpitSnapshot());
  },
);

/** @deprecated Do not link in UI — returns 404 in production. */
router.get(
  "/internal/ops/org-admin/cockpit",
  requireInternalOpsMutation("exec"),
  async (_req, res): Promise<void> => {
    if (process.env.NODE_ENV === "production") {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(await getOrgAdminCockpitSnapshot());
  },
);

router.post(
  "/internal/ops/exec/automations/:automationId/run",
  requireInternalOpsMutation("exec"),
  async (req, res): Promise<void> => {
    const id = String(req.params.automationId ?? "").trim();
    const confirm = req.body?.confirm === true || req.query.confirm === "true";
    const result = await runExecAutomation(id, { confirm });
    res.status(result.ok ? 200 : 400).json(result);
  },
);

router.get(
  "/internal/ops/exec/workforce-access",
  requireInternalOpsMutation("exec"),
  async (_req, res): Promise<void> => {
    res.json(await listCockpitWorkforceAccessGrants());
  },
);

router.post(
  "/internal/ops/exec/workforce-access",
  requireInternalOpsMutation("exec"),
  async (req, res): Promise<void> => {
    try {
      const operator = getInternalOpsOperator(req).email;
      const email = String(req.body?.email ?? "").trim();
      const tier = req.body?.tier === "full" ? "full" : "restricted";
      const notes = typeof req.body?.notes === "string" ? req.body.notes : undefined;
      const row = await grantCockpitWorkforceAccess({ email, tier, grantedBy: operator, notes });
      res.status(201).json({ ok: true, grant: row });
    } catch (e) {
      sendError(res, req, 400, safeClientMessage(e));
    }
  },
);

router.delete(
  "/internal/ops/exec/workforce-access/:email",
  requireInternalOpsMutation("exec"),
  async (req, res): Promise<void> => {
    try {
      const operator = getInternalOpsOperator(req).email;
      const email = decodeURIComponent(String(req.params.email ?? ""));
      await revokeCockpitWorkforceAccess({ email, revokedBy: operator });
      res.json({ ok: true });
    } catch (e) {
      sendError(res, req, 400, safeClientMessage(e));
    }
  },
);

router.get("/internal/ops/workforce-access/self", async (req, res): Promise<void> => {
  const operator = getInternalOpsOperator(req).email;
  res.json(await resolveWorkforceAccessTierForEmail(operator));
});

router.get("/internal/ops/observability", async (_req, res): Promise<void> => {
  res.json(await getPlatformObservability());
});

router.get("/internal/ops/monitoring/overview", async (_req, res): Promise<void> => {
  res.json(await getMonitoringOverview());
});

router.get("/internal/ops/monitoring/series", async (req, res): Promise<void> => {
  const hours =
    typeof req.query.hours === "string" ? Number.parseInt(req.query.hours, 10) : 24;
  res.json(await getMonitoringTimeSeries(Number.isFinite(hours) ? hours : 24));
});

router.get("/internal/ops/monitoring/logs", async (req, res): Promise<void> => {
  const hours =
    typeof req.query.hours === "string" ? Number.parseInt(req.query.hours, 10) : 24;
  const limit =
    typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 150;
  res.json(
    await searchPlatformLogs({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      level: typeof req.query.level === "string" ? req.query.level : undefined,
      source: typeof req.query.source === "string" ? req.query.source : undefined,
      type: typeof req.query.type === "string" ? req.query.type : undefined,
      businessId: typeof req.query.businessId === "string" ? req.query.businessId : undefined,
      requestId: typeof req.query.requestId === "string" ? req.query.requestId : undefined,
      hours: Number.isFinite(hours) ? hours : 24,
      limit: Number.isFinite(limit) ? limit : 150,
    }),
  );
});

router.get("/internal/ops/monitoring/loki", async (req, res): Promise<void> => {
  const hours =
    typeof req.query.hours === "string" ? Number.parseInt(req.query.hours, 10) : 6;
  res.json(
    await queryExternalLogsForOps({
      backend:
        req.query.backend === "openobserve"
          ? "openobserve"
          : req.query.backend === "loki"
            ? "loki"
            : "auto",
      query: typeof req.query.q === "string" ? req.query.q : undefined,
      sql: typeof req.query.sql === "string" ? req.query.sql : undefined,
      tenantId: typeof req.query.tenantId === "string" ? req.query.tenantId : undefined,
      requestId: typeof req.query.requestId === "string" ? req.query.requestId : undefined,
      level: typeof req.query.level === "string" ? req.query.level : undefined,
      hours: Number.isFinite(hours) ? hours : 6,
      limit:
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : 100,
    }),
  );
});

router.get("/internal/ops/monitoring/flows", async (_req, res): Promise<void> => {
  res.json(await getDataFlowStatus());
});

router.get("/internal/ops/monitoring/onboarding", async (_req, res): Promise<void> => {
  res.json(await getInternalOpsOnboardingChecklist());
});

router.get("/internal/ops/monitoring/report", async (_req, res): Promise<void> => {
  res.json(await getMonitoringReport());
});

router.post("/internal/ops/monitoring/seed-defaults", async (_req, res): Promise<void> => {
  await seedInternalOpsMonitoringDefaults();
  res.json({ ok: true });
});

router.get("/internal/ops/monitoring/alerts/rules", async (_req, res): Promise<void> => {
  res.json({ data: await listAlertRules() });
});

router.post(
  "/internal/ops/monitoring/alerts/rules",
  requireInternalOpsMutation("engineer"),
  async (req, res): Promise<void> => {
    try {
      const body = req.body ?? {};
      const rule = await createAlertRule({
        name: String(body.name ?? "").trim(),
        description: typeof body.description === "string" ? body.description : undefined,
        severity: body.severity === "critical" ? "critical" : "warn",
        metricKey: String(body.metricKey ?? ""),
        operator: String(body.operator ?? "gt"),
        threshold: Number(body.threshold),
        windowMinutes: Number(body.windowMinutes) || 15,
        createdBy: getInternalOpsOperator(req).email,
      });
      res.status(201).json(rule);
    } catch (err) {
      sendError(res, req, 400, err instanceof Error ? err.message : "Invalid rule");
    }
  },
);

router.patch(
  "/internal/ops/monitoring/alerts/rules/:ruleId",
  requireInternalOpsMutation("engineer"),
  async (req, res): Promise<void> => {
    const ruleId = Array.isArray(req.params.ruleId) ? req.params.ruleId[0] : req.params.ruleId;
    const body = req.body ?? {};
    const rule = await patchAlertRule(ruleId, {
      name: typeof body.name === "string" ? body.name : undefined,
      description:
        body.description === null || typeof body.description === "string"
          ? body.description
          : undefined,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      severity: typeof body.severity === "string" ? body.severity : undefined,
      threshold: body.threshold !== undefined ? Number(body.threshold) : undefined,
      windowMinutes: body.windowMinutes !== undefined ? Number(body.windowMinutes) : undefined,
    });
    res.json(rule);
  },
);

router.get("/internal/ops/monitoring/alerts/firings", async (req, res): Promise<void> => {
  const openOnly = req.query.openOnly === "true";
  const limit =
    typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 50;
  res.json({ data: await listAlertFirings(Number.isFinite(limit) ? limit : 50, openOnly) });
});

router.post("/internal/ops/monitoring/alerts/evaluate", async (req, res): Promise<void> => {
  res.json(await evaluateAlertRules());
});

router.post(
  "/internal/ops/monitoring/alerts/firings/:firingId/acknowledge",
  requireInternalOpsMutation("support_l1"),
  async (req, res): Promise<void> => {
    const firingId = Array.isArray(req.params.firingId)
      ? req.params.firingId[0]
      : req.params.firingId;
    await acknowledgeAlertFiring(firingId, getInternalOpsOperator(req).email);
    res.json({ ok: true });
  },
);

router.post(
  "/internal/ops/monitoring/alerts/firings/:firingId/resolve",
  requireInternalOpsMutation("support_l1"),
  async (req, res): Promise<void> => {
    const firingId = Array.isArray(req.params.firingId)
      ? req.params.firingId[0]
      : req.params.firingId;
    await resolveAlertFiring(firingId);
    res.json({ ok: true });
  },
);

router.get("/internal/ops/monitoring/saved-searches", async (_req, res): Promise<void> => {
  res.json({ data: await listSavedLogSearches() });
});

router.post(
  "/internal/ops/monitoring/saved-searches",
  requireInternalOpsMutation("engineer"),
  async (req, res): Promise<void> => {
    const body = req.body ?? {};
    const row = await createSavedLogSearch({
      name: String(body.name ?? "").trim(),
      backend:
        body.backend === "loki" || body.backend === "openobserve" ? body.backend : "platform",
      queryJson: typeof body.queryJson === "object" && body.queryJson ? body.queryJson : {},
      pinned: Boolean(body.pinned),
      createdBy: getInternalOpsOperator(req).email,
    });
    res.status(201).json(row);
  },
);

router.delete(
  "/internal/ops/monitoring/saved-searches/:searchId",
  requireInternalOpsMutation("engineer"),
  async (req, res): Promise<void> => {
    const searchId = Array.isArray(req.params.searchId)
      ? req.params.searchId[0]
      : req.params.searchId;
    await deleteSavedLogSearch(searchId);
    res.status(204).end();
  },
);

router.get("/internal/ops/monitoring/grafana", async (_req, res): Promise<void> => {
  const panels = await listGrafanaPanels();
  res.json({ configured: panels.length > 0, panels });
});

router.get("/internal/ops/monitoring/log-fields", async (_req, res): Promise<void> => {
  const { getLogFieldContract } = await import("../lib/external-log-query");
  res.json(getLogFieldContract());
});

router.post("/internal/ops/stress-probes", async (req, res): Promise<void> => {
  const apiBase =
    typeof req.body?.apiBase === "string" && req.body.apiBase.trim()
      ? req.body.apiBase.trim()
      : `http://127.0.0.1:${process.env.PORT ?? 3001}`;
  res.json(await runInternalStressProbes(apiBase));
});

router.post("/internal/ops/demo/backfill-legal", async (_req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    sendError(res, _req, 403, "Not available in production");
    return;
  }
  res.json(await backfillDemoPlatformLegal());
});

router.post("/internal/ops/demo/ensure-ready", async (_req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    sendError(res, _req, 403, "Not available in production");
    return;
  }
  res.json(await ensureDemoOpsReadiness());
});

router.get("/internal/ops/continuity-traces", async (_req, res): Promise<void> => {
  res.json({ data: await listPlatformContinuityTraces(100) });
});

router.get("/internal/ops/trace/:requestId", async (req, res): Promise<void> => {
  const requestId = Array.isArray(req.params.requestId)
    ? req.params.requestId[0]
    : req.params.requestId;
  const businessId =
    typeof req.query.businessId === "string" ? req.query.businessId : undefined;
  const trace = await traceByRequestId(requestId, businessId);
  if (!trace) {
    sendError(res, req, 400, "Invalid requestId (UUID required)");
    return;
  }
  res.json(trace);
});

router.get("/internal/ops/docs", async (_req, res): Promise<void> => {
  res.json(await listCompanyDocs());
});

router.get("/internal/ops/docs/index", async (_req, res): Promise<void> => {
  res.json(await getCompanyDocsIndex());
});

router.get("/internal/ops/docs/file", async (req, res): Promise<void> => {
  const rel = typeof req.query.path === "string" ? req.query.path : "";
  if (!rel) {
    sendError(res, req, 400, "path query required");
    return;
  }
  const doc = await readCompanyDoc(rel);
  if (!doc) {
    sendError(res, req, 404, "Document not found");
    return;
  }
  res.json(doc);
});

router.get("/internal/ops/vertical-coverage", async (_req, res): Promise<void> => {
  res.json({ data: await listVerticalCoverageForOps() });
});

router.get("/internal/ops/sso-status", async (_req, res): Promise<void> => {
  res.json(internalSsoStatus());
});

router.get("/internal/ops/reports/weekly-platform", async (_req, res): Promise<void> => {
  res.json(await buildWeeklyPlatformReport());
});

router.get("/internal/ops/feature-flags", async (req, res): Promise<void> => {
  const businessId = typeof req.query.businessId === "string" ? req.query.businessId : undefined;
  const globalOnly = req.query.global === "true";
  res.json(await listInternalFeatureFlags({ businessId, globalOnly }));
});

router.patch("/internal/ops/feature-flags", requireInternalOpsMutation("engineer"), async (req, res): Promise<void> => {
  const { key, businessId, isEnabled, description } = req.body ?? {};
  if (!key || typeof isEnabled !== "boolean") {
    sendError(res, req, 400, "key and isEnabled required");
    return;
  }
  const row = await upsertInternalFeatureFlag({
    key: String(key),
    businessId: businessId ? String(businessId) : null,
    isEnabled,
    description: description ? String(description) : undefined,
  });
  res.json(row);
});

router.get("/internal/ops/feature-flags/business-search", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  if (!q.trim()) {
    res.json({ data: [] });
    return;
  }
  res.json({ data: await searchBusinessesForFlags(q) });
});

router.post("/internal/ops/impersonation/intent", requireInternalOpsMutation("support_l2"), async (req, res): Promise<void> => {
  try {
    const operator = getInternalOpsOperator(req);
    const intent = await recordImpersonationIntent({
      ticketId: String(req.body?.ticketId ?? ""),
      businessId: String(req.body?.businessId ?? ""),
      operatorEmail: operator.email,
      reason: String(req.body?.reason ?? ""),
    });
    if (!intent) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.status(201).json(intent);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "VALID_TICKET_REQUIRED" || msg === "REASON_REQUIRED") {
      sendError(res, req, 400, msg);
      return;
    }
    throw e;
  }
});

router.post("/internal/ops/liv/assist", async (req, res): Promise<void> => {
  const message = String(req.body?.message ?? "").trim();
  if (!message) {
    sendError(res, req, 400, "message is required");
    return;
  }
  try {
    const result = await handleInternalLivAssist({
      message,
      focusBusinessId:
        typeof req.body?.focusBusinessId === "string" ? req.body.focusBusinessId : undefined,
    });
    res.json(result);
  } catch (err) {
    logRouteError(req, err, "Internal Liv assist failed");
    sendError(res, req, 500, safeClientMessage(err, "Assist failed"));
  }
});

export default router;
