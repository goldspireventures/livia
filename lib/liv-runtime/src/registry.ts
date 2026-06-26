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

export type LivCopilotMode = "setup" | "ops" | "advisor";

export type RegisteredLivTool = LivToolDefinition & {
  id: string;
  risk: LivToolRisk;
  profiles: LivRuntimeProfile[];
  /** When omitted, tool is ops-only (backward compatible). */
  livModes?: LivCopilotMode[];
  requiresDirectBooking?: boolean;
  entitlements?: string[];
};

export const LIV_TOOL_FIND_SLOTS = "find_slots";
export const LIV_TOOL_CREATE_BOOKING = "create_booking";
export const LIV_TOOL_SEARCH_RETAIL_PRODUCTS = "search_retail_products";
export const LIV_TOOL_SEND_MESSAGE = "send_message";
export const LIV_TOOL_CONFIRM_BOOKING = "confirm_booking";
export const LIV_TOOL_CANCEL_BOOKING = "cancel_booking";
export const LIV_TOOL_RESCHEDULE_BOOKING = "reschedule_booking";
export const LIV_TOOL_LOOKUP_CUSTOMER = "lookup_customer";
export const LIV_TOOL_GET_BOOKING = "get_booking";
export const LIV_TOOL_LIST_STUCK_CONTINUITY = "list_stuck_continuity";
export const LIV_TOOL_LIST_DRIFT_CANDIDATES = "list_drift_candidates";
export const LIV_TOOL_DRAFT_DRIFT_RECOVERY = "draft_drift_recovery";
export const LIV_TOOL_MORNING_BRIEFING = "morning_briefing";
export const LIV_TOOL_SEARCH_TENANTS = "search_tenants";
export const LIV_TOOL_TENANT_SNAPSHOT = "tenant_snapshot";

export const LIV_TOOL_WELLNESS_PROPOSE_ROOM = "wellness_propose_room";
export const LIV_TOOL_WELLNESS_PACKAGE_BOOK = "wellness_propose_package_book";
export const LIV_TOOL_WELLNESS_EOD_CLOSE = "wellness_eod_close";
export const LIV_TOOL_WELLNESS_DUTY_SOLVER = "wellness_duty_solver";
export const LIV_TOOL_WELLNESS_REROOM = "wellness_reroom";

export const LIV_TOOL_GET_ACTIVATION_STATUS = "get_activation_status";
export const LIV_TOOL_GET_BUSINESS_TWIN = "get_business_twin";
export const LIV_TOOL_GET_COMMERCE_SNAPSHOT = "get_commerce_snapshot";
export const LIV_TOOL_GET_COMMERCE_SIGNALS = "get_commerce_signals";
export const LIV_TOOL_LIST_CAPABILITY_BLOCKERS = "list_capability_blockers";
export const LIV_TOOL_GET_OWNER_INTELLIGENCE = "get_owner_intelligence";
export const LIV_TOOL_LIST_PRESENTATION_PRESETS = "list_presentation_presets";
export const LIV_TOOL_GET_SETUP_CHECKLIST = "get_setup_checklist";
export const LIV_TOOL_GET_TENANT_EXPERIENCE = "get_tenant_experience";
export const LIV_TOOL_PREVIEW_PRESENTATION = "preview_presentation";
export const LIV_TOOL_APPLY_PRESENTATION_PRESET = "apply_presentation_preset";
export const LIV_TOOL_PATCH_LIV_PERSONA = "patch_liv_persona";
export const LIV_TOOL_PATCH_BRAND_ASSETS = "patch_brand_assets";
export const LIV_TOOL_EXPLAIN_OPERATIONAL_POLICY = "explain_operational_policy";
export const LIV_TOOL_PROPOSE_POLICY_PATCH = "propose_policy_patch";
export const LIV_TOOL_PATCH_BUSINESS_HOURS = "patch_business_hours";
export const LIV_TOOL_CONFIRM_PUBLIC_LINK = "confirm_public_link";
export const LIV_TOOL_PATCH_OPERATIONAL_POLICY = "patch_operational_policy";
export const LIV_TOOL_INVITE_STAFF = "invite_staff";
export const LIV_TOOL_ASSIGN_SERVICE = "assign_service";
export const LIV_TOOL_START_CHANNEL_CONNECT = "start_channel_connect";

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
    id: LIV_TOOL_SEARCH_RETAIL_PRODUCTS,
    name: LIV_TOOL_SEARCH_RETAIL_PRODUCTS,
    risk: "low",
    profiles: ["tenant_public", "tenant_staff"],
    entitlements: ["retail_pack"],
    description:
      "Search take-home retail products by name or category. Returns in-stock items with price and id for the guest bag.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional name or keyword search." },
        category: { type: "string", description: "Optional category filter." },
        limit: { type: "number", description: "Max results (default 6)." },
      },
      required: [],
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
    id: LIV_TOOL_LIST_DRIFT_CANDIDATES,
    name: LIV_TOOL_LIST_DRIFT_CANDIDATES,
    risk: "low",
    profiles: ["tenant_staff"],
    description:
      "List lapsed clients (completed visit 90+ days ago, no upcoming booking). Drift recovery queue.",
    input_schema: {
      type: "object",
      properties: {
        minDays: { type: "string", description: "Minimum days since last visit (default 90)." },
        limit: { type: "string", description: "Max rows (default 10)." },
      },
      required: [],
    },
  },
  {
    id: LIV_TOOL_DRAFT_DRIFT_RECOVERY,
    name: LIV_TOOL_DRAFT_DRIFT_RECOVERY,
    risk: "low",
    profiles: ["tenant_staff"],
    description:
      "Draft a warm re-engagement message for a lapsed client. Owner reviews before send_message.",
    input_schema: {
      type: "object",
      properties: {
        customerId: { type: "string" },
        customerName: { type: "string", description: "Optional if customerId unknown." },
        lastServiceName: { type: "string" },
        daysSinceVisit: { type: "string" },
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
  {
    id: LIV_TOOL_WELLNESS_PROPOSE_ROOM,
    name: LIV_TOOL_WELLNESS_PROPOSE_ROOM,
    risk: "low",
    profiles: ["tenant_staff"],
    description: "Propose an open room for a booking respecting turnover buffer.",
    input_schema: {
      type: "object",
      properties: {
        bookingId: { type: "string" },
        resourceId: { type: "string", description: "Optional target room id." },
      },
      required: ["bookingId"],
    },
  },
  {
    id: LIV_TOOL_WELLNESS_PACKAGE_BOOK,
    name: LIV_TOOL_WELLNESS_PACKAGE_BOOK,
    risk: "medium",
    profiles: ["tenant_staff"],
    description: "Book a session using the guest's active package credits.",
    input_schema: {
      type: "object",
      properties: {
        customerId: { type: "string" },
        serviceId: { type: "string" },
        startAt: { type: "string" },
      },
      required: ["customerId", "serviceId", "startAt"],
    },
  },
  {
    id: LIV_TOOL_WELLNESS_EOD_CLOSE,
    name: LIV_TOOL_WELLNESS_EOD_CLOSE,
    risk: "low",
    profiles: ["tenant_staff"],
    description: "End-of-day close narrative: today's completions, pending, tomorrow load.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_WELLNESS_DUTY_SOLVER,
    name: LIV_TOOL_WELLNESS_DUTY_SOLVER,
    risk: "low",
    profiles: ["tenant_staff"],
    description: "Find therapists free in a named room at a given hour.",
    input_schema: {
      type: "object",
      properties: {
        resourceName: { type: "string" },
        hour: { type: "number", description: "Hour 0-23 in business timezone." },
      },
      required: ["resourceName", "hour"],
    },
  },
  {
    id: LIV_TOOL_WELLNESS_REROOM,
    name: LIV_TOOL_WELLNESS_REROOM,
    risk: "low",
    profiles: ["tenant_staff"],
    description: "Propose rerooming after a cancellation with turnover-aware open lanes.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_GET_ACTIVATION_STATUS,
    name: LIV_TOOL_GET_ACTIVATION_STATUS,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Get V1 activation status — sacred metric (first booking), setup progress, time-to-first-booking.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_GET_BUSINESS_TWIN,
    name: LIV_TOOL_GET_BUSINESS_TWIN,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup", "ops", "advisor"],
    description:
      "Read Business Twin — domain health scores, headline, and prioritized recommendations with evidence and confidence. Primary tool in advisor mode before coaching the owner.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_GET_COMMERCE_SNAPSHOT,
    name: LIV_TOOL_GET_COMMERCE_SNAPSHOT,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup", "ops", "advisor"],
    description:
      "Read 30-day commerce snapshot — captured revenue, payment count, capture rate, refunds. Use when advising on deposits, Stripe, or revenue health.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_GET_COMMERCE_SIGNALS,
    name: LIV_TOOL_GET_COMMERCE_SIGNALS,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup", "ops", "advisor"],
    description:
      "Read structured commerce signals (uncaptured demand, low capture, refunds). Prefer over raw snapshot when coaching owner strategy.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_LIST_CAPABILITY_BLOCKERS,
    name: LIV_TOOL_LIST_CAPABILITY_BLOCKERS,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup", "ops", "advisor"],
    description:
      "List capability readiness blockers and health score. Use before advising on setup or which capability to fix next.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_GET_OWNER_INTELLIGENCE,
    name: LIV_TOOL_GET_OWNER_INTELLIGENCE,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["ops"],
      description:
      "Unified owner intelligence — commerce signals, capability health, Twin top recommendation, remediation tasks, billing add-ons, and Liv prompts. Prefer this first when coaching owner strategy on Today.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_LIST_PRESENTATION_PRESETS,
    name: LIV_TOOL_LIST_PRESENTATION_PRESETS,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "List presentation presets allowed for this vertical (skin / atmosphere). Read-only — use Settings to apply.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_GET_SETUP_CHECKLIST,
    name: LIV_TOOL_GET_SETUP_CHECKLIST,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Get blocking onboarding acts, activation steps, and next recommended setup action.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_GET_TENANT_EXPERIENCE,
    name: LIV_TOOL_GET_TENANT_EXPERIENCE,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Read tenant experience bundle — vocabulary, onboarding welcome, presentation preset, public link.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_PREVIEW_PRESENTATION,
    name: LIV_TOOL_PREVIEW_PRESENTATION,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Preview a presentation preset (dashboard + public paths). Does not apply — owner confirms before apply_presentation_preset.",
    input_schema: {
      type: "object",
      properties: {
        presentationPresetId: { type: "string", description: "Preset id from list_presentation_presets." },
        brandAccentHex: { type: "string", description: "Optional #RRGGBB accent for preview." },
      },
      required: ["presentationPresetId"],
    },
  },
  {
    id: LIV_TOOL_APPLY_PRESENTATION_PRESET,
    name: LIV_TOOL_APPLY_PRESENTATION_PRESET,
    risk: "medium",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Apply a presentation preset after owner preview. Requires confirm: true.",
    input_schema: {
      type: "object",
      properties: {
        presentationPresetId: { type: "string" },
        brandAccentHex: { type: "string", description: "Optional #RRGGBB" },
        confirm: { type: "string", description: "Must be true after owner approves preview." },
      },
      required: ["presentationPresetId", "confirm"],
    },
  },
  {
    id: LIV_TOOL_PATCH_LIV_PERSONA,
    name: LIV_TOOL_PATCH_LIV_PERSONA,
    risk: "medium",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description: "Patch Liv persona fields (tone, greeting, knowledge, booking flags). Requires confirm: true.",
    input_schema: {
      type: "object",
      properties: {
        aiTone: { type: "string" },
        aiGreeting: { type: "string" },
        aiKnowledge: { type: "string" },
        aiEnabled: { type: "string", description: "true or false" },
        aiCanBookDirectly: { type: "string", description: "true or false" },
        confirm: { type: "string", description: "Must be true before applying." },
      },
      required: ["confirm"],
    },
  },
  {
    id: LIV_TOOL_PATCH_BRAND_ASSETS,
    name: LIV_TOOL_PATCH_BRAND_ASSETS,
    risk: "medium",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description: "Patch brand logo URL, cover image URL, and/or accent hex. Requires confirm: true.",
    input_schema: {
      type: "object",
      properties: {
        logoUrl: { type: "string" },
        coverImageUrl: { type: "string" },
        brandAccentHex: { type: "string", description: "#RRGGBB or empty to clear" },
        confirm: { type: "string" },
      },
      required: ["confirm"],
    },
  },
  {
    id: LIV_TOOL_EXPLAIN_OPERATIONAL_POLICY,
    name: LIV_TOOL_EXPLAIN_OPERATIONAL_POLICY,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description: "Explain current operational policy (deposits, cancel window, continuity) in plain language.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    id: LIV_TOOL_PROPOSE_POLICY_PATCH,
    name: LIV_TOOL_PROPOSE_POLICY_PATCH,
    risk: "high",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Propose operational policy changes (read-only diff). Owner applies via Settings — does not write.",
    input_schema: {
      type: "object",
      properties: {
        depositRequired: { type: "string" },
        depositPercent: { type: "string" },
        cancelWindowHours: { type: "string" },
        bookingContinuityEnabled: { type: "string" },
        lateGraceMinutes: { type: "string" },
      },
      required: [],
    },
  },
  {
    id: LIV_TOOL_PATCH_BUSINESS_HOURS,
    name: LIV_TOOL_PATCH_BUSINESS_HOURS,
    risk: "medium",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Replace business-wide opening hours (availability rules). Pass rules as JSON array [{dayOfWeek:0-6,startTime,endTime}]. Requires confirm: true.",
    input_schema: {
      type: "object",
      properties: {
        rulesJson: {
          type: "string",
          description:
            'JSON array e.g. [{"dayOfWeek":1,"startTime":"09:00","endTime":"18:00"}] — Mon=1, Sun=0',
        },
        staffId: { type: "string", description: "Optional staff member; omit for business default" },
        confirm: { type: "string" },
      },
      required: ["rulesJson", "confirm"],
    },
  },
  {
    id: LIV_TOOL_CONFIRM_PUBLIC_LINK,
    name: LIV_TOOL_CONFIRM_PUBLIC_LINK,
    risk: "medium",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Mark the public booking link step complete after owner confirms they have the /b link. Requires confirm: true.",
    input_schema: {
      type: "object",
      properties: {
        confirm: { type: "string", description: "Must be true after owner confirms link." },
      },
      required: ["confirm"],
    },
  },
  {
    id: LIV_TOOL_PATCH_OPERATIONAL_POLICY,
    name: LIV_TOOL_PATCH_OPERATIONAL_POLICY,
    risk: "high",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Apply operational policy changes (deposits, cancel window, continuity). Use propose_policy_patch first. Requires confirm: true.",
    input_schema: {
      type: "object",
      properties: {
        depositRequired: { type: "string" },
        depositPercent: { type: "string" },
        cancelWindowHours: { type: "string" },
        bookingContinuityEnabled: { type: "string" },
        lateGraceMinutes: { type: "string" },
        confirm: { type: "string" },
      },
      required: ["confirm"],
    },
  },
  {
    id: LIV_TOOL_INVITE_STAFF,
    name: LIV_TOOL_INVITE_STAFF,
    risk: "high",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Invite a teammate by email (Clerk invitation). role: ADMIN or STAFF. Requires confirm: true.",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        role: { type: "string", description: "ADMIN or STAFF" },
        deskRole: { type: "string", description: "Optional: manager or reception" },
        confirm: { type: "string" },
      },
      required: ["email", "role", "confirm"],
    },
  },
  {
    id: LIV_TOOL_ASSIGN_SERVICE,
    name: LIV_TOOL_ASSIGN_SERVICE,
    risk: "high",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Replace which services a staff member can perform. Pass serviceIdsJson as JSON array of service ids. Requires confirm: true.",
    input_schema: {
      type: "object",
      properties: {
        staffId: { type: "string" },
        serviceIdsJson: { type: "string", description: 'JSON array e.g. ["svc_abc","svc_def"]' },
        confirm: { type: "string" },
      },
      required: ["staffId", "serviceIdsJson", "confirm"],
    },
  },
  {
    id: LIV_TOOL_START_CHANNEL_CONNECT,
    name: LIV_TOOL_START_CHANNEL_CONNECT,
    risk: "low",
    profiles: ["tenant_staff"],
    livModes: ["setup"],
    description:
      "Read-only handoff for SMS/WhatsApp/Instagram setup — returns Settings comms path and connection status. No tokens in chat.",
    input_schema: {
      type: "object",
      properties: {
        channel: {
          type: "string",
          description: "Optional focus: sms, whatsapp, instagram, or all",
        },
      },
      required: [],
    },
  },
];

export type ResolveLivToolsInput = {
  profile: LivRuntimeProfile;
  canBookDirectly: boolean;
  /** setup = configure shop; ops = run the day (default). */
  livMode?: LivCopilotMode;
  extraToolIds?: string[];
  entitlements?: string[];
};

function toolMatchesLivMode(tool: RegisteredLivTool, livMode: LivCopilotMode): boolean {
  const modes = tool.livModes ?? ["ops"];
  return modes.includes(livMode);
}

export function listRegisteredTools(): RegisteredLivTool[] {
  return [...CATALOG];
}

export function resolveLivTools(input: ResolveLivToolsInput): LivToolDefinition[] {
  const entitlements = new Set(input.entitlements ?? []);
  const extraIds = new Set(input.extraToolIds ?? []);
  const livMode = input.livMode ?? "ops";

  return CATALOG.filter((t) => {
    if (!t.profiles.includes(input.profile)) return false;
    if (!toolMatchesLivMode(t, livMode)) return false;
    if (t.requiresDirectBooking && !input.canBookDirectly) return false;
    if (t.entitlements?.length && !t.entitlements.every((e) => entitlements.has(e))) return false;
    if (t.id.startsWith("wellness_") && !extraIds.has(t.id)) return false;
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
