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
  isCustomerServedByStaff,
} from "../services/customers.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

// Access: OWNER+ADMIN+STAFF.
// STAFF (or OWNER/ADMIN viewing-as-staff) sees only the customers their
// staff row has served. OWNER/ADMIN see all.
router.get(
  "/businesses/:businessId/customers",
  requireAuth,
  requireRole("STAFF"),
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

// Access: OWNER+ADMIN+STAFF — but STAFF only sees customers they served.
router.get(
  "/businesses/:businessId/customers/:customerId",
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
        res.status(404).json({ error: "Customer not found" });
        return;
      }
    }

    const c = await getCustomerDetail(businessId, customerId);
    if (!c) { res.status(404).json({ error: "Customer not found" }); return; }
    res.json(c);
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
    if (!c) { res.status(404).json({ error: "Customer not found" }); return; }
    await logEvent({ type: EventType.CUSTOMER_UPDATED, businessId, userId, entityType: "customer", entityId: customerId });
    res.json(c);
  },
);

export default router;
