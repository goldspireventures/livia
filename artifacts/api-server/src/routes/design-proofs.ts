import { Router, type IRouter } from "express";
import {
  type DesignProofKind,
  type DesignProofPublishRight,
  normalizeDesignProofKind,
  normalizeDesignProofPublishRight,
} from "@workspace/policy";
import { withBusinessFeature } from "../lib/wedge-api-gate";
import {
  createDesignProof,
  listDesignProofs,
  updateDesignProof,
  type DesignProofStatus,
} from "../services/design-proofs.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

const STATUSES: DesignProofStatus[] = ["draft", "pending_review", "approved", "rejected"];

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
    const body = req.body ?? {};
    const row = await createDesignProof(bizId(req.params.businessId), {
      customerId: body.customerId,
      bookingId: body.bookingId,
      imageUrl: body.imageUrl,
      note: body.note,
      proofKind: body.proofKind as DesignProofKind | undefined,
      publishRight: body.publishRight as DesignProofPublishRight | undefined,
    });
    res.status(201).json(row);
  }),
);

router.get(
  "/businesses/:businessId/design-proofs/:proofId/revisions",
  ...withBusinessFeature("design-proofs", "STAFF", async (req, res) => {
    const { listDesignProofRevisions, ensureDesignProofRevisionsSeeded } = await import(
      "../services/design-proof-revisions.service"
    );
    const proofId = bizId(req.params.proofId);
    await ensureDesignProofRevisionsSeeded(proofId);
    const rows = await listDesignProofRevisions(proofId);
    res.json(
      rows.map((r) => ({
        version: r.version,
        imageUrl: r.imageUrl,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  }),
);

router.patch(
  "/businesses/:businessId/design-proofs/:proofId",
  ...withBusinessFeature("design-proofs", "ADMIN", async (req, res) => {
    const body = req.body ?? {};
    const status = body.status as DesignProofStatus | undefined;
    if (status && !STATUSES.includes(status)) {
      sendError(res, req, 400, "invalid status");
      return;
    }

    const row = await updateDesignProof(bizId(req.params.businessId), bizId(req.params.proofId), {
      status,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
      note: typeof body.note === "string" ? body.note : undefined,
      proofKind: body.proofKind ? normalizeDesignProofKind(body.proofKind) : undefined,
      publishRight: body.publishRight
        ? normalizeDesignProofPublishRight(body.publishRight)
        : undefined,
      replaceArtwork: body.replaceArtwork === true,
      resendAfterReplace: body.resendAfterReplace === true,
      revertToVersion:
        typeof body.revertToVersion === "number" ? body.revertToVersion : undefined,
      resendAfterRevert: body.resendAfterRevert === true,
    });

    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

export default router;
