import { Router, type IRouter } from "express";
import { withBusinessFeature } from "../lib/wedge-api-gate";
import {
  createDesignProof,
  listDesignProofs,
  updateDesignProofStatus,
} from "../services/design-proofs.service";
import { ensureDesignProofGuestAccess } from "../services/design-proof-guest-access.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/design-proofs",
  ...withBusinessFeature("design-proofs", "STAFF", async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    res.json(await listDesignProofs(bizId(req.params.businessId), status));
  }),
);

router.post(
  "/businesses/:businessId/design-proofs",
  ...withBusinessFeature("design-proofs", "ADMIN", async (req, res) => {
    const row = await createDesignProof(bizId(req.params.businessId), req.body ?? {});
    res.status(201).json(row);
  }),
);

router.patch(
  "/businesses/:businessId/design-proofs/:proofId",
  ...withBusinessFeature("design-proofs", "ADMIN", async (req, res) => {
    const status = req.body?.status;
    if (!["draft", "pending_review", "approved", "rejected"].includes(status)) {
      sendError(res, req, 400, "invalid status");
      return;
    }
    const row = await updateDesignProofStatus(
      bizId(req.params.businessId),
      bizId(req.params.proofId),
      status,
    );
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    let guestToken: string | null = null;
    if (status === "pending_review") {
      guestToken = await ensureDesignProofGuestAccess(bizId(req.params.businessId), row.id);
    }
    res.json({ ...row, guestToken });
  }),
);

export default router;
