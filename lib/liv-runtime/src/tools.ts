/** Anthropic tool definitions — derived from registry (see registry.ts). */
export type LivToolDefinition = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
};

import {
  LIV_TOOL_FIND_SLOTS,
  LIV_TOOL_CREATE_BOOKING,
  LIV_TOOL_SEND_MESSAGE,
  LIV_TOOL_CONFIRM_BOOKING,
  LIV_TOOL_CANCEL_BOOKING,
  LIV_TOOL_RESCHEDULE_BOOKING,
  LIV_TOOL_LOOKUP_CUSTOMER,
  LIV_TOOL_LIST_STUCK_CONTINUITY,
  LIV_TOOL_LIST_DRIFT_CANDIDATES,
  LIV_TOOL_DRAFT_DRIFT_RECOVERY,
  LIV_TOOL_MORNING_BRIEFING,
  LIV_TOOL_SEARCH_TENANTS,
  LIV_TOOL_TENANT_SNAPSHOT,
  resolveLivTools,
  listRegisteredTools,
  getRegisteredTool,
  type LivRuntimeProfile,
  type ResolveLivToolsInput,
} from "./registry";

export {
  LIV_TOOL_FIND_SLOTS,
  LIV_TOOL_CREATE_BOOKING,
  LIV_TOOL_SEND_MESSAGE,
  LIV_TOOL_CONFIRM_BOOKING,
  LIV_TOOL_CANCEL_BOOKING,
  LIV_TOOL_RESCHEDULE_BOOKING,
  LIV_TOOL_LOOKUP_CUSTOMER,
  LIV_TOOL_LIST_STUCK_CONTINUITY,
  LIV_TOOL_LIST_DRIFT_CANDIDATES,
  LIV_TOOL_DRAFT_DRIFT_RECOVERY,
  LIV_TOOL_MORNING_BRIEFING,
  LIV_TOOL_SEARCH_TENANTS,
  LIV_TOOL_TENANT_SNAPSHOT,
  resolveLivTools,
  listRegisteredTools,
  getRegisteredTool,
  type LivRuntimeProfile,
  type ResolveLivToolsInput,
};

/** Default public-tenant tool set (direct booking enabled). Prefer resolveLivTools in production. */
export const LIV_TOOLS: LivToolDefinition[] = resolveLivTools({
  profile: "tenant_public",
  canBookDirectly: true,
});

/** @deprecated Use resolveLivTools */
export function filterLivToolsForDirectBooking(
  tools: LivToolDefinition[],
  canBookDirectly: boolean,
): LivToolDefinition[] {
  if (canBookDirectly) return tools;
  return tools.filter((t) => t.name !== "create_booking");
}
