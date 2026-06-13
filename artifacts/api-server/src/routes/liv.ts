import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import { appendHumanAudit } from "../lib/audit";
import {
  getMorningBriefing,
  generateMorningBriefingForBusiness,
} from "../services/morning-briefing.service";
import {
  getActivePromptOverrides,
  listPromptVersions,
  upsertPromptVersion,
  LIV_PROMPT_KEYS,
  type LivPromptKey,
} from "../services/prompt-store.service";
import { getLivPackForBusiness, patchLivPackForBusiness } from "../services/liv-pack.service";
import {
  listMergeSuggestions,
  mergeCustomerProfiles,
} from "../services/identity-merge-suggestions.service";
import { createMediaAsset, listMediaAssets } from "../services/media-assets.service";
import { handleStaffLivAssist, handleSetupLivCopilot, handleOwnerLivOps } from "../services/ai-chat-staff";
import {
  getLivPresenceForBusiness,
  type LivPresenceContext,
} from "../services/liv-presence.service";
import { dismissLivSignal, listActiveLivMoments } from "../services/liv-signals.service";
import { listLivIncidentsForBusiness } from "../services/liv-incidents.service";
import {
  getLivMandateForBusiness,
  patchLivMandateForBusiness,
  listPendingLivProposals,
  resolveLivProposal,
  livMandateSchema,
} from "../services/liv-mandate.service";
import {
  generatePersonaReport,
  listPersonaReportsForRole,
} from "../services/persona-reports.service";
import { personaReportSlugSchema } from "@workspace/policy";
import { logRouteError, safeClientMessage, sendError } from "../lib/http-errors";
import {
  getLivOutboundSettingsView,
  patchLivOutboundOverrides,
} from "../services/liv-outbound.service";

const router: IRouter = Router();

const PRESENCE_CONTEXTS = new Set<LivPresenceContext>([
  "owner_today",
  "manager_today",
  "staff_today",
  "reception_today",
]);
const getBizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/liv-presence",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const raw = typeof req.query.context === "string" ? req.query.context : "owner_today";
    const context = PRESENCE_CONTEXTS.has(raw as LivPresenceContext)
      ? (raw as LivPresenceContext)
      : "owner_today";
    const staffId =
      typeof req.query.staffId === "string" ? req.query.staffId : undefined;
    const payload = await getLivPresenceForBusiness({
      businessId,
      context,
      staffId,
    });
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(payload);
  },
);

router.get(
  "/businesses/:businessId/liv-moments",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const limit = req.query.limit ? Math.min(20, parseInt(String(req.query.limit), 10)) : 8;
    res.json({ data: await listActiveLivMoments(businessId, limit) });
  },
);

router.get(
  "/businesses/:businessId/liv-incidents",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const limit = req.query.limit ? Math.min(30, parseInt(String(req.query.limit), 10)) : 20;
    const payload = await listLivIncidentsForBusiness(businessId, limit);
    res.json(payload);
  },
);

router.post(
  "/businesses/:businessId/liv-moments/:signalId/dismiss",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const signalId = getBizId(req.params.signalId);
    const ok = await dismissLivSignal(businessId, signalId);
    if (!ok) {
      sendError(res, req, 404, "Signal not found");
      return;
    }
    res.json({ ok: true });
  },
);

router.get(
  "/businesses/:businessId/morning-briefing",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const payload = await getMorningBriefing(businessId);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(payload);
  },
);

router.post(
  "/businesses/:businessId/morning-briefing/generate",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const row = await generateMorningBriefingForBusiness(businessId);
    if (!row) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(row);
  },
);

router.get(
  "/businesses/:businessId/liv-outbound",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const view = await getLivOutboundSettingsView(businessId);
    if (!view) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(view);
  },
);

router.patch(
  "/businesses/:businessId/liv-outbound",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const row = await patchLivOutboundOverrides(businessId, req.body ?? {});
    if (!row) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(await getLivOutboundSettingsView(businessId));
  },
);

router.get(
  "/businesses/:businessId/liv-prompts",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const key = typeof req.query.key === "string" ? req.query.key : undefined;
    const versions = await listPromptVersions(businessId, key);
    const active = await getActivePromptOverrides(businessId);
    res.json({ keys: LIV_PROMPT_KEYS, active, versions });
  },
);

router.patch(
  "/businesses/:businessId/liv-prompts",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const promptKey = String(req.body?.promptKey ?? "") as LivPromptKey;
    const content = String(req.body?.content ?? "").trim();
    if (!LIV_PROMPT_KEYS.includes(promptKey) || !content) {
      sendError(res, req, 400, "promptKey and content required");
      return;
    }
    const row = await upsertPromptVersion({ businessId, promptKey, content });
    await appendHumanAudit(businessId, userId, "human.liv.prompt.update", "business", businessId, {
      promptKey,
      version: row.version,
    });
    res.json(row);
  },
);

router.get(
  "/businesses/:businessId/liv-pack",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const pack = await getLivPackForBusiness(businessId);
    if (!pack) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(pack);
  },
);

router.patch(
  "/businesses/:businessId/liv-pack",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const pack = await patchLivPackForBusiness(businessId, req.body ?? {});
    if (!pack) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    await appendHumanAudit(businessId, userId, "human.liv.pack.update", "business", businessId, {
      fields: Object.keys(req.body ?? {}),
    });
    res.json(pack);
  },
);

router.get(
  "/businesses/:businessId/customers/merge-suggestions",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 25;
    res.json(await listMergeSuggestions(businessId, limit));
  },
);

router.post(
  "/businesses/:businessId/customers/merge-profiles",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const sourceCustomerId = String(req.body?.sourceCustomerId ?? "");
    const targetCustomerId = String(req.body?.targetCustomerId ?? "");
    if (!sourceCustomerId || !targetCustomerId) {
      sendError(res, req, 400, "sourceCustomerId and targetCustomerId required");
      return;
    }
    const result = await mergeCustomerProfiles(businessId, sourceCustomerId, targetCustomerId);
    await appendHumanAudit(
      businessId,
      userId,
      "human.customer.merge_profiles",
      "customer",
      targetCustomerId,
      { sourceCustomerId, ...result },
    );
    res.json(result);
  },
);

router.get(
  "/businesses/:businessId/media",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
    const entityId = typeof req.query.entityId === "string" ? req.query.entityId : undefined;
    const rows = await listMediaAssets(businessId, { entityType, entityId });
    res.json({ data: rows });
  },
);

router.post(
  "/businesses/:businessId/media",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const url = String(req.body?.url ?? "").trim();
    if (!url) {
      sendError(res, req, 400, "url is required");
      return;
    }
    const row = await createMediaAsset(businessId, {
      url,
      kind: req.body?.kind,
      mimeType: req.body?.mimeType,
      entityType: req.body?.entityType,
      entityId: req.body?.entityId,
    });
    await appendHumanAudit(businessId, userId, "human.media.create", "media", row.id, {
      entityType: row.entityType,
      entityId: row.entityId,
    });
    res.status(201).json(row);
  },
);

router.get(
  "/businesses/:businessId/liv-capabilities",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const profile =
      typeof req.query.profile === "string" && req.query.profile === "tenant_public"
        ? "tenant_public"
        : "tenant_staff";
    const { getLivCapabilitiesForBusiness } = await import(
      "../services/liv-capabilities.service"
    );
    const caps = await getLivCapabilitiesForBusiness(businessId, profile);
    if (!caps) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(caps);
  },
);

router.get(
  "/businesses/:businessId/liv-tools",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const profile =
      typeof req.query.profile === "string" && req.query.profile === "tenant_public"
        ? ("tenant_public" as const)
        : ("tenant_staff" as const);
    const { listLivToolsForBusinessAdmin } = await import(
      "../services/liv-tool-catalog.service"
    );
    res.json({ tools: await listLivToolsForBusinessAdmin(businessId, profile) });
  },
);

router.patch(
  "/businesses/:businessId/liv-tools/:toolId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const toolId = getBizId(req.params.toolId);
    const profile =
      req.body?.profile === "tenant_public" ? ("tenant_public" as const) : ("tenant_staff" as const);
    const enabled = !!req.body?.enabled;
    const { setLivToolOverrideForBusiness } = await import(
      "../services/liv-tool-catalog.service"
    );
    await setLivToolOverrideForBusiness({
      businessId,
      toolId,
      profile,
      enabled,
      userId: getUserId(req),
    });
    res.json({ ok: true, toolId, profile, enabled });
  },
);

router.post(
  "/businesses/:businessId/liv-tools/sync-catalog",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const { syncLivToolCatalogFromRegistry } = await import(
      "../services/liv-tool-catalog.service"
    );
    const count = await syncLivToolCatalogFromRegistry();
    res.json({ synced: count });
  },
);

router.get(
  "/businesses/:businessId/liv-mandate",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const payload = await getLivMandateForBusiness(businessId);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    res.json(payload);
  },
);

router.patch(
  "/businesses/:businessId/liv-mandate",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const parsed = livMandateSchema.partial().safeParse(req.body?.mandate ?? req.body);
    if (!parsed.success) {
      sendError(res, req, 400, "Invalid Liv mandate", { details: parsed.error.flatten() });
      return;
    }
    const payload = await patchLivMandateForBusiness(businessId, parsed.data);
    if (!payload) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    await appendHumanAudit(businessId, getUserId(req), "human.liv.mandate.update", "business", businessId, {
      rung: parsed.data.rung,
    });
    res.json(payload);
  },
);

router.get(
  "/businesses/:businessId/liv-proposals",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    res.json({ data: await listPendingLivProposals(businessId) });
  },
);

router.post(
  "/businesses/:businessId/liv-proposals/:proposalId/resolve",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const proposalId = getBizId(req.params.proposalId);
    const status = req.body?.status === "dismissed" ? "dismissed" : "approved";
    const row = await resolveLivProposal({
      proposalId,
      businessId,
      userId: getUserId(req),
      status,
    });
    if (!row) {
      sendError(res, req, 404, "Proposal not found");
      return;
    }
    await appendHumanAudit(businessId, getUserId(req), "human.liv.proposal.resolve", "liv_proposal", proposalId, {
      status,
    });
    const { extractLivProposalNavigateHref } = await import("@workspace/policy");
    const execution = row && "execution" in row ? row.execution : undefined;
    const effects =
      execution && typeof execution === "object" && "effects" in execution
        ? (execution.effects as string[] | undefined)
        : undefined;
    const nextHref =
      status === "approved" ? extractLivProposalNavigateHref(effects) : null;
    res.json({ ...row, nextHref });
  },
);

router.get(
  "/businesses/:businessId/reports",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const roleV2 = typeof req.query.roleV2 === "string" ? req.query.roleV2 : "OWN";
    res.json({ reports: listPersonaReportsForRole(roleV2) });
  },
);

router.get(
  "/businesses/:businessId/reports/accountant_preview/export",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const { buildAccountantPreview, accountantPreviewToCsv } = await import(
      "../services/accountant-export.service"
    );
    const preview = await buildAccountantPreview(businessId, 7);
    if (!preview) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    const csv = accountantPreviewToCsv(preview);
    if (req.query.download === "1") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=livia-accountant-preview.csv");
      res.send(csv);
      return;
    }
    res.json({ csv, preview });
  },
);

router.get(
  "/businesses/:businessId/reports/:slug",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const slugRaw = getBizId(req.params.slug);
    const parsed = personaReportSlugSchema.safeParse(slugRaw);
    if (!parsed.success) {
      sendError(res, req, 400, "Unknown report");
      return;
    }
    const report = await generatePersonaReport(businessId, parsed.data, getUserId(req));
    if (!report) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    if ("forbidden" in report && report.forbidden) {
      sendError(res, req, 403, "Report not available for your role");
      return;
    }
    res.json(report);
  },
);

router.get(
  "/businesses/:businessId/liv-setup/guided-flow",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    try {
      const { getSetupGuidedFlowForBusiness } = await import(
        "../services/setup-guided-flow.service"
      );
      const flow = await getSetupGuidedFlowForBusiness(businessId);
      if (!flow) {
        sendError(res, req, 404, "Business not found");
        return;
      }
      res.json(flow);
    } catch (err: unknown) {
      logRouteError(req, err, "liv-setup guided-flow failed", { businessId });
      sendError(res, req, 500, safeClientMessage(err, "Guided flow failed"));
    }
  },
);

router.post(
  "/businesses/:businessId/liv-owner/assist",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const message = String(req.body?.message ?? "").trim();
    if (!message) {
      sendError(res, req, 400, "message is required");
      return;
    }
    const history = Array.isArray(req.body?.history)
      ? (req.body.history as { role: string; content: string }[])
          .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: String(m.content),
          }))
      : undefined;
    try {
      const result = await handleOwnerLivOps({
        businessId,
        message,
        staffUserId: getUserId(req),
        history,
      });
      res.json(result);
    } catch (err: unknown) {
      logRouteError(req, err, "liv-owner assist failed", { businessId });
      sendError(res, req, 500, safeClientMessage(err, "Liv owner assist failed"));
    }
  },
);

router.post(
  "/businesses/:businessId/liv-setup/assist",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const message = String(req.body?.message ?? "").trim();
    if (!message) {
      sendError(res, req, 400, "message is required");
      return;
    }
    const history = Array.isArray(req.body?.history)
      ? (req.body.history as { role: string; content: string }[])
          .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: String(m.content),
          }))
      : undefined;
    try {
      const result = await handleSetupLivCopilot({
        businessId,
        message,
        staffUserId: getUserId(req),
        history,
      });
      res.json(result);
    } catch (err: unknown) {
      logRouteError(req, err, "liv-setup assist failed", { businessId });
      sendError(res, req, 500, safeClientMessage(err, "Liv setup assist failed"));
    }
  },
);

router.post(
  "/businesses/:businessId/conversations/:conversationId/liv-assist",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const conversationId = getBizId(req.params.conversationId);
    const message = String(req.body?.message ?? "").trim();
    if (!message) {
      sendError(res, req, 400, "message is required");
      return;
    }
    try {
      const livModeRaw = req.body?.livMode;
      const livMode =
        livModeRaw === "setup" || livModeRaw === "ops" ? livModeRaw : undefined;
      const result = await handleStaffLivAssist({
        businessId,
        conversationId,
        message,
        staffUserId: getUserId(req),
        livMode,
      });
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "CONVERSATION_NOT_FOUND") {
        sendError(res, req, 404, "Conversation not found");
        return;
      }
      logRouteError(req, err, "liv-assist failed", { businessId, conversationId });
      sendError(res, req, 500, safeClientMessage(err, "Liv assist failed"));
    }
  },
);

export default router;
