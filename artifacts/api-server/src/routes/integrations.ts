import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId } from "../lib/auth";
import {
  listWebhookEndpoints,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  listApiCredentials,
  createTenantApiKey,
  revokeApiCredential,
  listRecentWebhookDeliveries,
  listWebhookableEvents,
} from "../services/integrations.service";
import { sendTestWebhook } from "../services/webhook-delivery.service";
import { PARTNER_SCOPES } from "../lib/partner-scopes";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/integrations",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    res.json({
      webhookableEvents: listWebhookableEvents(),
      availableScopes: PARTNER_SCOPES,
      webhooks: await listWebhookEndpoints(businessId),
      apiKeys: await listApiCredentials(businessId),
      recentDeliveries: await listRecentWebhookDeliveries(businessId),
    });
  },
);

router.post(
  "/businesses/:businessId/integrations/webhooks",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const { url, subscribedEvents, description } = req.body ?? {};
    if (!url || typeof url !== "string") {
      sendError(res, req, 400, "url is required");
      return;
    }
    try {
      const { endpoint, secret } = await createWebhookEndpoint(businessId, {
        url,
        subscribedEvents: Array.isArray(subscribedEvents) ? subscribedEvents : [],
        description,
      });
      res.status(201).json({
        endpoint: {
          id: endpoint.id,
          url: endpoint.url,
          subscribedEvents: endpoint.subscribedEvents,
          enabled: endpoint.enabled,
          description: endpoint.description,
        },
        secret,
        message: "Store the signing secret now — it will not be shown again.",
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "INVALID_EVENTS") {
        sendError(res, req, 400, "subscribedEvents must include at least one valid event");
        return;
      }
      throw err;
    }
  },
);

router.patch(
  "/businesses/:businessId/integrations/webhooks/:endpointId",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const endpointId = getBizId(req.params.endpointId);
    const row = await updateWebhookEndpoint(businessId, endpointId, req.body ?? {});
    if (!row) {
      sendError(res, req, 404, "Webhook endpoint not found");
      return;
    }
    res.json({ endpoint: row });
  },
);

router.delete(
  "/businesses/:businessId/integrations/webhooks/:endpointId",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const endpointId = getBizId(req.params.endpointId);
    await deleteWebhookEndpoint(businessId, endpointId);
    res.status(204).end();
  },
);

router.post(
  "/businesses/:businessId/integrations/webhooks/:endpointId/test",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const endpointId = getBizId(req.params.endpointId);
    try {
      const result = await sendTestWebhook(businessId, endpointId);
      res.json(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "ENDPOINT_NOT_FOUND") {
        sendError(res, req, 404, "Webhook endpoint not found");
        return;
      }
      throw err;
    }
  },
);

router.post(
  "/businesses/:businessId/integrations/api-keys",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const userId = getUserId(req);
    const { label, scopes } = req.body ?? {};
    if (!label || typeof label !== "string") {
      sendError(res, req, 400, "label is required");
      return;
    }
    try {
      const created = await createTenantApiKey(businessId, userId, {
        label,
        scopes: Array.isArray(scopes) ? scopes : [],
      });
      res.status(201).json({
        ...created,
        message: "Store the API key now — it will not be shown again.",
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "INVALID_SCOPES") {
        sendError(res, req, 400, "scopes must include at least one valid scope");
        return;
      }
      throw err;
    }
  },
);

router.delete(
  "/businesses/:businessId/integrations/api-keys/:credentialId",
  requireAuth,
  requireRole("OWNER"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const credentialId = getBizId(req.params.credentialId);
    await revokeApiCredential(businessId, credentialId);
    res.status(204).end();
  },
);

export default router;
