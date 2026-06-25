import { humanizeGatewayAuthError } from "@workspace/policy";

type ClerkErrorShape = {
  errors?: Array<{ message?: string; code?: string; longMessage?: string }>;
  message?: string;
};

export function extractClerkError(err: unknown): { code?: string; message: string } {
  const e = err as ClerkErrorShape;
  const first = e?.errors?.[0];
  const message = first?.longMessage ?? first?.message ?? e?.message ?? "Something went wrong.";
  return { code: first?.code, message };
}

export function formatClerkAuthError(err: unknown): string {
  const { code, message } = extractClerkError(err);
  return humanizeGatewayAuthError(code, message);
}

/** @deprecated use humanizeGatewayAuthError from @workspace/policy */
export function humanizeClerkAuthError(code: string | undefined, fallback: string | undefined): string {
  return humanizeGatewayAuthError(code, fallback);
}
