import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { userHasAccessToBusiness } from "../services/businesses.service";
import {
  listCustomers,
  getCustomerDetail,
  createCustomer,
  updateCustomer,
} from "../services/customers.service";
import { logEvent } from "../services/events.service";
import { EventType } from "@workspace/db";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => Array.isArray(param) ? param[0] : param;

router.get("/businesses/:businessId/customers", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const { search, isBlocked, limit, offset } = req.query;
  const result = await listCustomers(businessId, {
    search: search as string | undefined,
    isBlocked: isBlocked !== undefined ? isBlocked === "true" : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  });
  res.json(result);
});

router.post("/businesses/:businessId/customers", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const c = await createCustomer(businessId, req.body);
  await logEvent({ type: EventType.CUSTOMER_CREATED, businessId, userId, entityType: "customer", entityId: c.id });
  res.status(201).json(c);
});

router.get("/businesses/:businessId/customers/:customerId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const customerId = getBizId(req.params.customerId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const c = await getCustomerDetail(businessId, customerId);
  if (!c) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json(c);
});

router.patch("/businesses/:businessId/customers/:customerId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = getBizId(req.params.businessId);
  const customerId = getBizId(req.params.customerId);
  if (!(await userHasAccessToBusiness(userId, businessId))) {
    res.status(404).json({ error: "Business not found" }); return;
  }
  const c = await updateCustomer(businessId, customerId, req.body);
  if (!c) { res.status(404).json({ error: "Customer not found" }); return; }
  await logEvent({ type: EventType.CUSTOMER_UPDATED, businessId, userId, entityType: "customer", entityId: customerId });
  res.json(c);
});

export default router;
