import type { RequestHandler } from "express";
import { getUserId } from "./auth";
import { sendError } from "./http-errors";
import { ChairRentalCustomerFirewallError } from "../services/chair-rental-firewall.service";

/** Block host owners from reading renter tenant PII unless they also own the renter shop. */
export function requireChairRentalCustomerAccess(): RequestHandler {
  return async (req, res, next) => {
    try {
      const raw = req.params.businessId;
      const businessId = (Array.isArray(raw) ? raw[0] : raw)?.trim();
      if (!businessId) {
        sendError(res, req, 400, "businessId required");
        return;
      }
      const userId = getUserId(req);
      const { assertChairRentalCustomerFirewall } = await import(
        "../services/chair-rental-firewall.service"
      );
      await assertChairRentalCustomerFirewall(userId, businessId);
      next();
    } catch (err) {
      if (err instanceof ChairRentalCustomerFirewallError) {
        sendError(res, req, 403, "Chair-rental host cannot access renter client records.", {
          code: "CHAIR_RENTAL_FIREWALL",
        });
        return;
      }
      next(err);
    }
  };
}
