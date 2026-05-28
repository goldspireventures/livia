/**
 * Liv tool registry — single source of truth for agent capabilities.
 * Nothing business-specific is hardcoded in api-server; add tools here.
 */
import type { LivToolDefinition } from "./tools";

/** Who is invoking the runtime. */
export type LivRuntimeProfile =
  | "tenant_public" // customer-facing channels
  | "tenant_staff" // dashboard / staff assist
  | "livia_internal"; // Livia Inc operators

export type LivToolRisk = "low" | "medium" | "high";

export type RegisteredLivTool = LivToolDefinition & {
  id: string;
  risk: LivToolRisk;
  profiles: LivRuntimeProfile[];
  requiresDirectBooking?: boolean;
  entitlements?: string[];
};

export const LIV_TOOL_FIND_SLOTS = "find_slots";
export const LIV_TOOL_CREATE_BOOKING = "create_booking";
export const LIV_TOOL_SEND_MESSAGE = "send_message";
export const LIV_TOOL_CONFIRM_BOOKING = "confirm_booking";
export const LIV_TOOL_CANCEL_BOOKING = "cancel_booking";
export const LIV_TOOL_RESCHEDULE_BOOKING = "reschedule_booking";
export const LIV_TOOL_LOOKUP_CUSTOMER = "lookup_customer";
export const LIV_TOOL_GET_BOOKING = "get_booking";
export const LIV_TOOL_LIST_STUCK_CONTINUITY = "list_stuck_continuity";
export const LIV_TOOL_MORNING_BRIEFING = "morning_briefing";
export const LIV_TOOL_SEARCH_TENANTS = "search_tenants";
export const LIV_TOOL_TENANT_SNAPSHOT = "tenant_snapshot";

const CATALOG: RegisteredLivTool[] = [
  {
    id: LIV_TOOL_FIND_SLOTS,
    name: LIV_TOOL_FIND_SLOTS,
    risk: "low",
    profiles: ["tenant_public", "tenant_staff"],
    description:
      "Find available appointment time slots for a given service and date. Returns up to ~20 slots.",
    input_schema: {
      type: "object",
      properties: {
        serviceId: { type: "string", description: "The exact id of the service the customer wants." },
        date: { type: "string", description: "Date in YYYY-MM-DD format (in business timezone)." },
        staffId: { type: "string", description: "Optional. Specific staff member id." },
      },
      required: ["serviceId", "date"],
    },
  },
  {
    id: LIV_TOOL_CREATE_BOOKING,
    name: LIV_TOOL_CREATE_BOOKING,
    risk: "medium",
    profiles: ["tenant_public", "tenant_staff"],
    requiresDirectBooking: true,
    description: "Create a new appointment booking once the customer has confirmed the details.",
    input_schema: {
      type: "object",
      properties: {
        serviceId: { type: "string" },
        startAt: { type: "string", description: "ISO datetime returned by find_slots." },
        staffId: { type: "string", description: "Optional staff id." },
        customerFirstName: { type: "string" },
        customerLastName: { type: "string" },
        customerEmail: { type: "string" },
        customerPhone: { type: "string" },
        notes: { type: "string", description: "Any special requests from the customer." },
      },
      required: ["serviceId", "startAt", "customerFirstName"],
    },
  },
  {
    id: LIV_TOOL_SEND_MESSAGE,
    name: LIV_TOOL_SEND_MESSAGE,
    risk: "medium",
    profiles: ["tenant_staff"],
    description:
      "Send an outbound message to the customer on the conversation channel (staff/Liv assist).",
    input_schema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Message body to send to the customer." },
      },
      required: ["content"],
    },
  },
  {
    id: LIV_TOOL_CONFIRM_BOOKING,
    name: LIV_TOOL_CONFIRM_BOOKING,
    risk: "medium",
    profiles: ["tenant_staff"],
    description: "Confirm a PENDING booking (clears pending reason).",
    input_schema: {
      type: "object",
      properties: {
        bookingId: { type: "string" },
      },
      required: ["bookingId"],
    },
  },
  {
    id: LIV_TOOL_CANCEL_BOOKING,
    name: LIV_TOOL_CANCEL_BOOKING,
    risk: "medium",
    profiles: ["tenant_staff"],
    description: "Cancel a booking with an optional reason.",
    input_schema: {
      type: "object",
      properties: {
        bookingId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["bookingId"],
    },
  },
  {
    id: LIV_TOOL_RESCHEDULE_BOOKING,
    name: LIV_TOOL_RESCHEDULE_BOOKING,
    risk: "medium",
    profiles: ["tenant_staff"],
    description: "Move a booking to a new start time (ISO datetime).",
    input_schema: {
      type: "object",
      properties: {
        bookingId: { type: "string" },
        startAt: { type: "string", description: "New ISO start time." },
      },
      required: ["bookingId", "startAt"],
    },
  },
  {
    id: LIV_TOOL_GET_BOOKING,
    name: LIV_TOOL_GET_BOOKING,
    risk: "low",
    profiles: ["tenant_staff"],
    description: "Get booking details by id (status, time, customer, service).",
    input_schema: {
      type: "object",
      properties: {
        bookingId: { type: "string" },
      },
      required: ["bookingId"],
    },
  },
  {
    id: LIV_TOOL_LIST_STUCK_CONTINUITY,
    name: LIV_TOOL_LIST_STUCK_CONTINUITY,
    risk: "low",
    profiles: ["tenant_staff"],
    description:
      "List web bookings stuck in continuity (customer has not replied 24h+). Owner/manager recovery queue.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "string", description: "Max rows (default 10)." },
      },
      required: [],
    },
  },
  {
    id: LIV_TOOL_MORNING_BRIEFING,
    name: LIV_TOOL_MORNING_BRIEFING,
    risk: "low",
    profiles: ["tenant_staff"],
    description: "Get today's morning briefing: appointments, pending items, inbox handoffs.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    id: LIV_TOOL_LOOKUP_CUSTOMER,
    name: LIV_TOOL_LOOKUP_CUSTOMER,
    risk: "low",
    profiles: ["tenant_staff"],
    description: "Search customers by name, email, or phone.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    id: LIV_TOOL_SEARCH_TENANTS,
    name: LIV_TOOL_SEARCH_TENANTS,
    risk: "low",
    profiles: ["livia_internal"],
    description: "Search Livia tenants by name, slug, email, Stripe id, or owner id.",
    input_schema: {
      type: "object",
      properties: {
        q: { type: "string" },
        limit: { type: "string", description: "Max results (default 10)." },
      },
      required: ["q"],
    },
  },
  {
    id: LIV_TOOL_TENANT_SNAPSHOT,
    name: LIV_TOOL_TENANT_SNAPSHOT,
    risk: "low",
    profiles: ["livia_internal"],
    description: "Health snapshot for one tenant business id.",
    input_schema: {
      type: "object",
      properties: {
        businessId: { type: "string" },
      },
      required: ["businessId"],
    },
  },
];

export type ResolveLivToolsInput = {
  profile: LivRuntimeProfile;
  canBookDirectly: boolean;
  extraToolIds?: string[];
  entitlements?: string[];
};

export function listRegisteredTools(): RegisteredLivTool[] {
  return [...CATALOG];
}

export function resolveLivTools(input: ResolveLivToolsInput): LivToolDefinition[] {
  const entitlements = new Set(input.entitlements ?? []);

  return CATALOG.filter((t) => {
    if (!t.profiles.includes(input.profile)) return false;
    if (t.requiresDirectBooking && !input.canBookDirectly) return false;
    if (t.entitlements?.length && !t.entitlements.every((e) => entitlements.has(e))) return false;
    return true;
  }).map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema,
  }));
}

export function getRegisteredTool(id: string): RegisteredLivTool | undefined {
  return CATALOG.find((t) => t.id === id || t.name === id);
}
