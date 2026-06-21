import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { importBooksyCsv } from "../services/booksy-import.service";
import {
  runMagicStudioImport,
  runUniversalCsvImport,
} from "../services/universal-import.service";
import { sendError } from "../lib/http-errors";
import { businessVerticalSchema, type ImportEntityKind } from "@workspace/policy";

const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

const KINDS = new Set<ImportEntityKind>(["clients", "services", "appointments", "staff"]);

function readCsvBody(body: unknown): string {
  if (typeof body === "string") return body;
  if (body && typeof body === "object" && typeof (body as { csv?: string }).csv === "string") {
    return (body as { csv: string }).csv;
  }
  return "";
}

router.post(
  "/businesses/:businessId/import/booksy-csv",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const csv = readCsvBody(req.body);
    if (!csv.trim()) {
      sendError(res, req, 400, "csv text required in body.csv");
      return;
    }
    res.json(await importBooksyCsv(bizId(req.params.businessId), csv));
  },
);

router.post(
  "/businesses/:businessId/import/csv",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const csv = readCsvBody(req.body);
    if (!csv.trim()) {
      sendError(res, req, 400, "csv text required in body.csv");
      return;
    }
    const kindRaw = req.body?.kind;
    const kindHint =
      typeof kindRaw === "string" && KINDS.has(kindRaw as ImportEntityKind)
        ? (kindRaw as ImportEntityKind)
        : undefined;
    const applyOnboarding = req.body?.applyOnboarding !== false;

    res.json(
      await runUniversalCsvImport(bizId(req.params.businessId), csv, {
        kindHint,
        applyOnboarding,
      }),
    );
  },
);

router.post(
  "/businesses/:businessId/import/magic-setup",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const body = req.body ?? {};
    const bundles = {
      clientsCsv: typeof body.clientsCsv === "string" ? body.clientsCsv : undefined,
      servicesCsv: typeof body.servicesCsv === "string" ? body.servicesCsv : undefined,
      appointmentsCsv: typeof body.appointmentsCsv === "string" ? body.appointmentsCsv : undefined,
      staffCsv: typeof body.staffCsv === "string" ? body.staffCsv : undefined,
    };
    if (!Object.values(bundles).some((v) => v?.trim())) {
      sendError(res, req, 400, "At least one CSV bundle required");
      return;
    }
    res.json(await runMagicStudioImport(bizId(req.params.businessId), bundles));
  },
);

router.post(
  "/businesses/:businessId/import/preview",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const csv = readCsvBody(req.body);
    if (!csv.trim()) {
      sendError(res, req, 400, "csv text required");
      return;
    }
    const { parseCsvImport, IMPORT_KIND_LABELS } = await import("@workspace/policy");
    const parsed = parseCsvImport(csv);
    res.json({
      detectedKind: parsed.format?.kind ?? null,
      kindLabel: parsed.format ? IMPORT_KIND_LABELS[parsed.format.kind] : null,
      confidence: parsed.format?.confidence ?? 0,
      rowCount: parsed.records.length,
      headers: parsed.headers,
      sampleRow: parsed.records[0] ?? null,
    });
  },
);

router.get(
  "/businesses/:businessId/competitive-parity",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const { getBusinessById } = await import("../services/businesses.service");
    const biz = await getBusinessById(bizId(req.params.businessId));
    if (!biz) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    const vertical = businessVerticalSchema.safeParse(biz.vertical);
    if (!vertical.success) {
      sendError(res, req, 400, "Unknown vertical");
      return;
    }
    const { parityGapsForVertical, parityScorePercent, incumbentCategoriesForVertical } =
      await import("@workspace/policy");
    const gaps = parityGapsForVertical(vertical.data, "owner_plus_staff", biz.tier ?? undefined);
    res.json({
      vertical: vertical.data,
      scorePercent: parityScorePercent(gaps),
      gaps,
      incumbentCategories: incumbentCategoriesForVertical(vertical.data),
    });
  },
);

router.get(
  "/businesses/:businessId/migration/parallel-run",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const external =
      req.query.external === "fresha" ? "fresha" : ("mindbody" as "mindbody" | "fresha");
    const { getParallelRunDiff } = await import("../services/wellness-parallel-run.service");
    res.json(await getParallelRunDiff(bizId(req.params.businessId), external));
  },
);

router.post(
  "/businesses/:businessId/import/oauth/start",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const brokerId = typeof req.body?.brokerId === "string" ? req.body.brokerId : "";
    const businessId = bizId(req.params.businessId);
    const { INTEGRATION_CATALOG } = await import("@workspace/policy");
    const entry = INTEGRATION_CATALOG.find((e) => e.id === brokerId);
    if (!entry || (entry.mode !== "oauth" && entry.mode !== "api_read")) {
      sendError(res, req, 400, "Unknown OAuth import broker");
      return;
    }

    const {
      buildAuthorizeUrl,
      OAUTH_BROKER_CONFIGS,
      upsertTenantIntegrationConnection,
    } = await import("../services/integration-oauth.service");

    if (entry.mode === "api_read" && typeof req.body?.apiKey === "string" && req.body.apiKey.trim()) {
      await upsertTenantIntegrationConnection({
        businessId,
        brokerId,
        accessToken: req.body.apiKey.trim(),
        metadata: { connectMode: "api_key" },
      });
      res.json({
        status: "connected",
        brokerId,
        label: entry.label,
        message: `${entry.label} API key saved for your shop.`,
      });
      return;
    }

    if (entry.envKey && !process.env[entry.envKey]) {
      res.json({
        status: "pending_credentials",
        brokerId,
        label: entry.label,
        message: `Connect ${entry.label} when workspace credentials are configured. Use CSV import meanwhile.`,
      });
      return;
    }

    const authorizeUrl = OAUTH_BROKER_CONFIGS[brokerId]
      ? buildAuthorizeUrl(brokerId, businessId)
      : null;

    if (authorizeUrl) {
      res.json({
        status: "redirect",
        brokerId,
        label: entry.label,
        authorizeUrl,
        message: "Redirecting to connect…",
      });
      return;
    }

    res.json({
      status: "api_key_required",
      brokerId,
      label: entry.label,
      message: "Paste your read-only API key in the connect dialog, or use CSV import today.",
    });
  },
);

router.get("/import/oauth/callback", async (req, res): Promise<void> => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const dashboardBase =
    process.env.DASHBOARD_PUBLIC_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:5173";

  if (!code || !state) {
    res.redirect(`${dashboardBase}/settings?tab=integrations&oauth=error`);
    return;
  }

  const {
    verifyOAuthState,
    exchangeOAuthCode,
    upsertTenantIntegrationConnection,
  } = await import("../services/integration-oauth.service");

  const parsed = verifyOAuthState(state);
  if (!parsed) {
    res.redirect(`${dashboardBase}/settings?tab=integrations&oauth=invalid_state`);
    return;
  }

  const tokens = await exchangeOAuthCode(parsed.brokerId, code);
  if (!tokens) {
    res.redirect(`${dashboardBase}/settings?tab=integrations&oauth=exchange_failed`);
    return;
  }

  await upsertTenantIntegrationConnection({
    businessId: parsed.businessId,
    brokerId: parsed.brokerId,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
  });

  if (parsed.brokerId === "calendar_google") {
    void import("../services/google-calendar-sync.service").then((m) =>
      m.runGoogleCalendarSync(parsed.businessId),
    );
  }

  res.redirect(`${dashboardBase}/settings?tab=integrations&oauth=connected&broker=${parsed.brokerId}`);
});

export default router;
