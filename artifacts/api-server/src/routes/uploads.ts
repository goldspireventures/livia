import { Router, type IRouter } from "express";
import express from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../lib/auth";
import { sendError } from "../lib/http-errors";
import { storeBusinessImageUpload } from "../lib/upload-store";
import { createMediaAsset } from "../services/media-assets.service";

const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024) },
});

async function persistUpload(
  businessId: string,
  buffer: Buffer,
  mimeType: string,
  entityType?: string,
  entityId?: string,
) {
  const stored = await storeBusinessImageUpload({ businessId, buffer, mimeType });
  const asset = await createMediaAsset(businessId, {
    url: stored.url,
    mimeType,
    kind: "image",
    entityType,
    entityId,
  });
  return { url: stored.url, mediaId: asset.id };
}

router.post(
  "/businesses/:businessId/uploads",
  requireAuth,
  requireRole("STAFF"),
  upload.single("file"),
  async (req, res) => {
    const businessId = bizId(req.params.businessId);
    const file = req.file;
    if (!file?.buffer?.length) {
      sendError(res, req, 400, "file_required");
      return;
    }
    try {
      const entityType =
        typeof req.body?.entityType === "string" ? req.body.entityType : undefined;
      const entityId = typeof req.body?.entityId === "string" ? req.body.entityId : undefined;
      const result = await persistUpload(
        businessId,
        file.buffer,
        file.mimetype || "image/jpeg",
        entityType,
        entityId,
      );
      res.status(201).json(result);
    } catch (e) {
      sendError(res, req, 400, e instanceof Error ? e.message : "upload_failed");
    }
  },
);

router.post(
  "/businesses/:businessId/uploads/base64",
  requireAuth,
  requireRole("STAFF"),
  express.json({ limit: "15mb" }),
  async (req, res) => {
    const businessId = bizId(req.params.businessId);
    const raw = String(req.body?.contentBase64 ?? "").trim();
    const mimeType = String(req.body?.mimeType ?? "image/jpeg").trim();
    if (!raw) {
      sendError(res, req, 400, "contentBase64 required");
      return;
    }
    const b64 = raw.includes(",") ? (raw.split(",").pop() ?? "") : raw;
    try {
      const buffer = Buffer.from(b64, "base64");
      const entityType =
        typeof req.body?.entityType === "string" ? req.body.entityType : undefined;
      const entityId = typeof req.body?.entityId === "string" ? req.body.entityId : undefined;
      const result = await persistUpload(businessId, buffer, mimeType, entityType, entityId);
      res.status(201).json(result);
    } catch (e) {
      sendError(res, req, 400, e instanceof Error ? e.message : "upload_failed");
    }
  },
);

export default router;
