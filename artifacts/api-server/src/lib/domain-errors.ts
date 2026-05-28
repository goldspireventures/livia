import type { Request, Response } from "express";
import { logRouteError, safeClientMessage, sendError } from "./http-errors";

/** Map thrown domain errors to HTTP responses with requestId. */
const DOMAIN_ERRORS: Record<string, { status: number; message: string; code?: string }> = {
  SERVICE_NOT_FOUND: { status: 400, message: "Service not found" },
  SLOT_CONFLICT: { status: 409, message: "Slot is no longer available", code: "SLOT_CONFLICT" },
  RESOURCE_AT_CAPACITY: {
    status: 409,
    message: "That room or suite is full for the chosen time",
    code: "RESOURCE_AT_CAPACITY",
  },
  STAFF_NOT_ASSIGNED_TO_SERVICE: {
    status: 400,
    message: "That team member is not assigned to this service — update Team → Services first.",
  },
  STAFF_NOT_FOUND: { status: 400, message: "Staff member not found or inactive" },
  PARENT_BUSINESS_NOT_FOUND: { status: 400, message: "Parent business not found" },
  BUSINESS_NOT_FOUND: { status: 404, message: "Business not found" },
  BOOKING_NOT_FOUND: { status: 404, message: "Booking not found" },
  BOOKING_NOT_ACTIVE: { status: 409, message: "Booking is not active", code: "BOOKING_NOT_ACTIVE" },
  INVALID_SCORE: { status: 400, message: "score must be 1–5" },
  BOOKING_NOT_COMPLETED: { status: 409, message: "Booking not completed yet" },
  ALREADY_SUBMITTED: { status: 409, message: "Feedback already submitted" },
  GO_LIVE_REQUIRES_TEST_BOOKING: {
    status: 409,
    message: "Complete a test booking (public page or New booking) before going live.",
    code: "GO_LIVE_REQUIRES_TEST_BOOKING",
  },
};

export function replyDomainError(req: Request, res: Response, err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith("INVALID_TRANSITION")) {
    sendError(res, req, 409, "Invalid status transition", { code: "INVALID_TRANSITION" });
    return true;
  }
  if (msg.startsWith("NAMING_")) {
    sendError(res, req, 400, msg.replace(/^NAMING_[A-Z]+:/, "").trim());
    return true;
  }
  const mapped = DOMAIN_ERRORS[msg];
  if (mapped) {
    sendError(res, req, mapped.status, mapped.message, mapped.code ? { code: mapped.code } : undefined);
    return true;
  }
  return false;
}

export function replyRouteError(
  req: Request,
  res: Response,
  err: unknown,
  logMessage: string,
  fallback = "Request failed",
): void {
  if (replyDomainError(req, res, err)) return;
  logRouteError(req, err, logMessage);
  sendError(res, req, 500, safeClientMessage(err, fallback));
}

// fix typo - sendError(res, req, ...)