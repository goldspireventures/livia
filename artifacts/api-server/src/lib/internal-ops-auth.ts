import type { Request, Response, NextFunction, RequestHandler } from "express";
import { sendError } from "./http-errors";

/**
 * Livia Inc operator routes — separate from tenant Clerk JWT.
 * Header: X-Internal-Ops-Secret (falls back to INTERNAL_CRON_SECRET in dev).
 */
export function getInternalOpsSecret(): string | undefined {
  const ops = process.env["INTERNAL_OPS_SECRET"]?.trim();
  if (ops) return ops;
  if (process.env.NODE_ENV === "production") return undefined;
  return process.env["INTERNAL_CRON_SECRET"]?.trim();
}

export function authorizeInternalOps(req: Request): boolean {
  const expected = getInternalOpsSecret();
  if (!expected) return false;
  const got = req.headers["x-internal-ops-secret"] ?? req.headers["x-internal-cron-secret"];
  return typeof got === "string" && got === expected;
}

export const requireInternalOps: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!authorizeInternalOps(req)) {
    sendError(res, req, 401, "Unauthorized", { code: "INTERNAL_OPS_UNAUTHORIZED" });
    return;
  }
  next();
};
