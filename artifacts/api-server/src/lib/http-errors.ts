import type { Request, Response } from "express";
import { Sentry } from "./sentry";
import { logger } from "./logger";

export function getRequestId(req: Request): string | undefined {
  return (req as Request & { id?: string }).id;
}

/** Safe client message — never forward raw upstream errors in production. */
export function safeClientMessage(err: unknown, fallback = "Request failed"): string {
  if (process.env.NODE_ENV !== "production" && err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export function sendError(
  res: Response,
  req: Request,
  status: number,
  error: string,
  extra?: Record<string, unknown>,
): void {
  const requestId = getRequestId(req);
  res.status(status).json({
    error,
    requestId: requestId ?? undefined,
    ...extra,
  });
}

export function logRouteError(
  req: Request,
  err: unknown,
  message: string,
  fields?: Record<string, unknown>,
): void {
  const requestId = getRequestId(req);
  logger.error(
    {
      err,
      request_id: requestId,
      method: req.method,
      path: (req.url ?? "").split("?")[0],
      ...fields,
    },
    message,
  );
  Sentry.withScope((scope) => {
    if (requestId) scope.setTag("request_id", requestId);
    const tid = req.resolvedTenant?.businessId;
    if (tid) scope.setTag("tenant_id", tid);
    Sentry.captureException(err);
  });
}
