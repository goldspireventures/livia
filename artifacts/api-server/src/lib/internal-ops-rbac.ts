import type { Request, Response, NextFunction, RequestHandler } from "express";
import { sendError } from "./http-errors";

export const INTERNAL_OPS_ROLES = [
  // Highest privilege operator role (company side).
  // Legacy name was "founder"; we keep backwards-compat in parsing below.
  "exec",
  "engineer",
  "support_l2",
  "support_l1",
  "finance_read",
] as const;

export type InternalOpsRole = (typeof INTERNAL_OPS_ROLES)[number];

const ROLE_RANK: Record<InternalOpsRole, number> = {
  exec: 50,
  engineer: 40,
  support_l2: 30,
  support_l1: 20,
  finance_read: 10,
};

export type InternalOpsOperator = {
  email: string;
  role: InternalOpsRole;
};

export function parseInternalOpsOperator(req: Request): InternalOpsOperator | null {
  const email = String(req.headers["x-internal-ops-operator"] ?? "").trim().toLowerCase();
  const roleRaw0 = String(req.headers["x-internal-ops-role"] ?? "").trim().toLowerCase();
  const roleRaw = roleRaw0 === "founder" ? "exec" : roleRaw0;
  if (!email || !INTERNAL_OPS_ROLES.includes(roleRaw as InternalOpsRole)) {
    if (process.env.NODE_ENV !== "production") {
      return {
        email: email || "dev-operator@livia.io",
        role: (INTERNAL_OPS_ROLES.includes(roleRaw as InternalOpsRole)
          ? roleRaw
          : "engineer") as InternalOpsRole,
      };
    }
    return null;
  }
  return { email, role: roleRaw as InternalOpsRole };
}

export function hasInternalOpsRole(
  operator: InternalOpsOperator,
  minimum: InternalOpsRole,
): boolean {
  return ROLE_RANK[operator.role] >= ROLE_RANK[minimum];
}

/** Mutations require operator identity + minimum role. */
export function requireInternalOpsMutation(minimum: InternalOpsRole): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const operator = parseInternalOpsOperator(req);
    if (!operator) {
      sendError(res, req, 401, "X-Internal-Ops-Operator and X-Internal-Ops-Role required", {
        code: "INTERNAL_OPS_OPERATOR_REQUIRED",
      });
      return;
    }
    if (!hasInternalOpsRole(operator, minimum)) {
      sendError(res, req, 403, `Requires internal role ${minimum} or higher`, {
        code: "INTERNAL_OPS_FORBIDDEN",
      });
      return;
    }
    (req as Request & { internalOpsOperator?: InternalOpsOperator }).internalOpsOperator =
      operator;
    next();
  };
}

export function getInternalOpsOperator(req: Request): InternalOpsOperator {
  const op = (req as Request & { internalOpsOperator?: InternalOpsOperator }).internalOpsOperator;
  if (!op) {
    return parseInternalOpsOperator(req) ?? { email: "unknown@livia.io", role: "support_l1" };
  }
  return op;
}
