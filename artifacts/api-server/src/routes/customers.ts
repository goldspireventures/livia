// Customer roster.
//
// STAFF-scoping note: when the effective role is STAFF, list/get reads
// are filtered to "customers I have served". This is enforced in the
// query, not just the UI — even a hand-crafted request from a STAFF
// caller can't see customers belonging to a colleague.

import { Router, type IRouter } from "express";
import { requireAuth, requireRole, getUserId, getRoleContext } from "../lib/auth";
import {
  listCustomers,
  getCustomerDetail,
  createCustomer,
  updateCustomer,
  listCustomersServedByStaff,
  listFrequentCustomers,
  listFrequentCustomersForStaff,
  isCustomerServedByStaff,
} from "../services/customers.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";
import { mergeChannelIdentity } from "../services/channel-identities.service";
import { appendHumanAudit } from "../lib/audit";

import { sendError } from "../lib/http-errors";
import { requireChairRentalCustomerAccess } from "../lib/chair-rental-firewall-middleware";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

// Access: OWNER+ADMIN+STAFF.
// STAFF (or OWNER/ADMIN viewing-as-staff) sees only the customers their
// staff row has served. OWNER/ADMIN see all.
router.get(
  "/businesses/:businessId/customers",
  requireAuth,
  requireRole("STAFF"),
  requireChairRentalCustomerAccess(),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const ctx = getRoleContext(req);
    const { search, isBlocked, limit, offset } = req.query;

    if (ctx.effectiveRole === "STAFF") {
      const result = await listCustomersServedByStaff(businessId, ctx.actingStaffId, {
        search: search as string | undefined,
        isBlocked: isBlocked !== undefined ? isBlocked === "true" : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(result);
      return;
    }

    const result = await listCustomers(businessId, {
      search: search as string | undefined,
      isBlocked: isBlocked !== undefined ? isBlocked === "true" : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json(result);
  },
);

// Access: OWNER+ADMIN — adding a customer outside of a booking flow
// is an admin/owner-curated action.
router.post(
  "/businesses/:businessId/customers",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const c = await createCustomer(businessId, req.body);
    await logEvent({ type: EventType.CUSTOMER_CREATED, businessId, userId, entityType: "customer", entityId: c.id });
    res.status(201).json(c);
  },
);

// Access: OWNER+ADMIN+STAFF — top clients by visit count (capped).
router.get(
  "/businesses/:businessId/customers/frequent",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const ctx = getRoleContext(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    if (ctx.effectiveRole === "STAFF") {
      const result = await listFrequentCustomersForStaff(businessId, ctx.actingStaffId, limit);
      res.json(result);
      return;
    }

    const result = await listFrequentCustomers(businessId, limit);
    res.json(result);
  },
);

// Access: OWNER+ADMIN+STAFF — but STAFF only sees customers they served.
router.get(
  "/businesses/:businessId/customers/:customerId",
  requireAuth,
  requireRole("STAFF"),
  requireChairRentalCustomerAccess(),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const ctx = getRoleContext(req);

    if (ctx.effectiveRole === "STAFF") {
      const ok = ctx.actingStaffId
        ? await isCustomerServedByStaff(businessId, customerId, ctx.actingStaffId)
        : false;
      if (!ok) {
        sendError(res, req, 404, "Customer not found");
        return;
      }
    }

    const c = await getCustomerDetail(businessId, customerId);
    if (!c) { sendError(res, req, 404, "Customer not found"); return; }
    res.json(c);
  },
);

router.get(
  "/businesses/:businessId/relationships/at-risk",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const limitRaw = req.query.limit;
    const limit =
      typeof limitRaw === "string" && limitRaw.trim()
        ? Math.min(20, Math.max(1, parseInt(limitRaw, 10)))
        : 10;
    const { listAtRiskGuestPreviews } = await import("../services/relationship.service");
    const data = await listAtRiskGuestPreviews(businessId, { limit });
    res.json({ data });
  },
);

router.get(
  "/businesses/:businessId/customers/:customerId/relationship",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const ctx = getRoleContext(req);

    if (ctx.effectiveRole === "STAFF") {
      const ok = ctx.actingStaffId
        ? await isCustomerServedByStaff(businessId, customerId, ctx.actingStaffId)
        : false;
      if (!ok) {
        sendError(res, req, 404, "Customer not found");
        return;
      }
    }

    const { getRelationshipSummary } = await import("../services/relationship.service");
    const summary = await getRelationshipSummary(businessId, customerId);
    if (!summary) {
      sendError(res, req, 404, "Customer not found");
      return;
    }
    res.json(summary);
  },
);

// Access: OWNER+ADMIN — customer profile edits are an admin action.
// (STAFF can leave per-customer notes via a future scoped endpoint.)
router.patch(
  "/businesses/:businessId/customers/:customerId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const c = await updateCustomer(businessId, customerId, req.body);
    if (!c) { sendError(res, req, 404, "Customer not found"); return; }
    await logEvent({ type: EventType.CUSTOMER_UPDATED, businessId, userId, entityType: "customer", entityId: customerId });
    res.json(c);
  },
);

router.post(
  "/businesses/:businessId/customers/:customerId/merge-identity",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const identityId = String(req.body?.identityId ?? "");
    if (!identityId) {
      sendError(res, req, 400, "identityId is required");
      return;
    }
    const result = await mergeChannelIdentity({
      businessId,
      identityId,
      targetCustomerId: customerId,
    });
    if (!result.ok) {
      sendError(res, req, 400, result.error ?? "Merge failed");
      return;
    }
    await appendHumanAudit(
      businessId,
      userId,
      "human.customer.merge_identity",
      "customer",
      customerId,
      { identityId },
    );
    await logEvent({
      type: EventType.CHANNEL_IDENTITY_LINKED,
      businessId,
      userId,
      entityType: "customer",
      entityId: customerId,
      context: { identityId, merged: true },
    });
    const c = await getCustomerDetail(businessId, customerId);
    res.json(c);
  },
);

router.get(
  "/businesses/:businessId/customers/:customerId/pets",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const { listPetsForCustomer } = await import("../services/pets.service");
    const pets = await listPetsForCustomer(businessId, customerId);
    res.json({ pets });
  },
);

router.post(
  "/businesses/:businessId/customers/:customerId/pets",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const { name, species, breed, behaviourNotes, allergyNotes, vaccinationNotes } = req.body;
    if (!name || typeof name !== "string") {
      sendError(res, req, 400, "name is required");
      return;
    }
    const { createPet } = await import("../services/pets.service");
    const pet = await createPet(businessId, customerId, {
      name,
      species,
      breed,
      behaviourNotes,
      allergyNotes,
      vaccinationNotes,
    });
    res.status(201).json(pet);
  },
);

router.get(
  "/businesses/:businessId/customers/:customerId/vehicles",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const { listVehiclesForCustomer } = await import("../services/vehicles.service");
    const vehicles = await listVehiclesForCustomer(businessId, customerId);
    res.json({ vehicles });
  },
);

router.post(
  "/businesses/:businessId/customers/:customerId/vehicles",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const { make, model, registration, colour, notes } = req.body;
    if (!model || typeof model !== "string") {
      sendError(res, req, 400, "model is required");
      return;
    }
    const { createVehicle } = await import("../services/vehicles.service");
    const vehicle = await createVehicle(businessId, customerId, {
      make,
      model,
      registration,
      colour,
      notes,
    });
    res.status(201).json(vehicle);
  },
);

router.get(
  "/businesses/:businessId/customers/:customerId/liv-memory",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const { listLivMemoryForEntity } = await import("../services/liv-memory.service");
    res.json({
      data: await listLivMemoryForEntity({
        businessId,
        entityType: "customer",
        entityId: customerId,
      }),
    });
  },
);

router.post(
  "/businesses/:businessId/customers/:customerId/liv-memory",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = getBizId(req.params.businessId);
    const customerId = getBizId(req.params.customerId);
    const content = String(req.body?.content ?? "").trim();
    const kind = (req.body?.kind as string) ?? "note";
    if (!content) {
      sendError(res, req, 400, "content is required");
      return;
    }
    const { getCachedTenantRuntime } = await import("../lib/tenant-runtime-pool");
    const { isAllowedLivMemoryKind } = await import("@workspace/policy");
    const runtime = await getCachedTenantRuntime(businessId);
    const memoryKind = isAllowedLivMemoryKind(
      kind,
      runtime.business.vertical,
      runtime.business.category,
    )
      ? kind
      : "note";
    const { appendLivMemory } = await import("../services/liv-memory.service");
    const row = await appendLivMemory({
      businessId,
      entityType: "customer",
      entityId: customerId,
      kind: memoryKind as "note" | "preference" | "ritual" | "pressure" | "therapist_pref" | "health_light",
      content,
      createdBy: "staff",
    });
    await appendHumanAudit(businessId, userId, "human.liv.memory.append", "customer", customerId, {
      memoryId: row.id,
      kind: row.kind,
    });
    res.status(201).json(row);
  },
);

export default router;
