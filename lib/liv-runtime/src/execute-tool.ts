import {
  LIV_TOOL_CANCEL_BOOKING,
  LIV_TOOL_CONFIRM_BOOKING,
  LIV_TOOL_CREATE_BOOKING,
  LIV_TOOL_FIND_SLOTS,
  LIV_TOOL_GET_BOOKING,
  LIV_TOOL_LIST_STUCK_CONTINUITY,
  LIV_TOOL_LOOKUP_CUSTOMER,
  LIV_TOOL_MORNING_BRIEFING,
  LIV_TOOL_RESCHEDULE_BOOKING,
  LIV_TOOL_SEARCH_TENANTS,
  LIV_TOOL_SEND_MESSAGE,
  LIV_TOOL_TENANT_SNAPSHOT,
} from "./registry";

export type LivSlot = {
  startAt: string;
  endAt: string;
  staffId: string | null;
  staffName: string | null;
};

export type LivToolDeps = {
  findSlots: (input: {
    serviceId: string;
    date: string;
    staffId?: string;
  }) => Promise<LivSlot[]>;
  sendMessage?: (input: { content: string }) => Promise<{ messageId: string }>;
  createBooking: (input: {
    serviceId: string;
    startAt: string;
    staffId?: string;
    customerFirstName: string;
    customerLastName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
    conversationId: string;
    channelType: "WEB" | "SMS" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER" | "VOICE";
  }) => Promise<{
    bookingId: string;
    customerId: string;
    status: string;
    startAt: string;
    endAt: string;
    serviceName: string | null;
    staffName: string | null;
  }>;
  confirmBooking?: (input: { bookingId: string }) => Promise<Record<string, unknown>>;
  cancelBooking?: (input: { bookingId: string; reason?: string }) => Promise<Record<string, unknown>>;
  rescheduleBooking?: (input: {
    bookingId: string;
    startAt: string;
  }) => Promise<Record<string, unknown>>;
  lookupCustomer?: (input: { query: string }) => Promise<Record<string, unknown>>;
  getBooking?: (input: { bookingId: string }) => Promise<Record<string, unknown>>;
  listStuckContinuity?: (input: { limit?: number }) => Promise<Record<string, unknown>>;
  morningBriefing?: () => Promise<Record<string, unknown>>;
  searchTenants?: (input: { q: string; limit?: number }) => Promise<Record<string, unknown>>;
  tenantSnapshot?: (input: { businessId: string }) => Promise<Record<string, unknown>>;
};

export type LivToolResult = {
  result: Record<string, unknown>;
  bookingId?: string;
};

function bookingToolError(message: string): LivToolResult {
  if (message === "SLOT_CONFLICT") {
    return {
      result: {
        ok: false,
        error: "SLOT_CONFLICT",
        message: "That slot was just taken. Try another.",
      },
    };
  }
  if (message.startsWith("INVALID_TRANSITION")) {
    return { result: { ok: false, error: "INVALID_TRANSITION", message } };
  }
  if (message === "BOOKING_NOT_FOUND") {
    return { result: { ok: false, error: "NOT_FOUND", message: "Booking not found." } };
  }
  return { result: { ok: false, error: "UNKNOWN", message } };
}

export async function executeLivTool(args: {
  toolName: string;
  toolInput: Record<string, unknown>;
  deps: LivToolDeps;
  conversationId: string;
  channelType: "WEB" | "SMS" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER" | "VOICE";
}): Promise<LivToolResult> {
  const { toolName, toolInput, deps, conversationId, channelType } = args;

  if (toolName === LIV_TOOL_FIND_SLOTS) {
    const slots = await deps.findSlots({
      serviceId: String(toolInput.serviceId),
      date: String(toolInput.date),
      staffId: toolInput.staffId ? String(toolInput.staffId) : undefined,
    });
    return {
      result: {
        date: toolInput.date,
        slots: slots.slice(0, 20),
      },
    };
  }

  if (toolName === LIV_TOOL_CREATE_BOOKING) {
    try {
      const created = await deps.createBooking({
        serviceId: String(toolInput.serviceId),
        startAt: String(toolInput.startAt),
        staffId: toolInput.staffId ? String(toolInput.staffId) : undefined,
        customerFirstName: String(toolInput.customerFirstName),
        customerLastName: toolInput.customerLastName
          ? String(toolInput.customerLastName)
          : undefined,
        customerEmail: toolInput.customerEmail ? String(toolInput.customerEmail) : undefined,
        customerPhone: toolInput.customerPhone ? String(toolInput.customerPhone) : undefined,
        notes: toolInput.notes ? String(toolInput.notes) : undefined,
        conversationId,
        channelType,
      });
      return {
        bookingId: created.bookingId,
        result: {
          ok: true,
          bookingId: created.bookingId,
          customerId: created.customerId,
          status: created.status,
          startAt: created.startAt,
          endAt: created.endAt,
          serviceName: created.serviceName,
          staffName: created.staffName,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "SERVICE_NOT_FOUND") {
        return {
          result: {
            ok: false,
            error: "SERVICE_NOT_FOUND",
            message: "Service not found.",
          },
        };
      }
      return bookingToolError(message);
    }
  }

  if (toolName === LIV_TOOL_SEND_MESSAGE) {
    if (!deps.sendMessage) {
      return { result: { ok: false, error: "SEND_NOT_CONFIGURED" } };
    }
    const content = String(toolInput.content ?? "").trim();
    if (!content) {
      return { result: { ok: false, error: "EMPTY_MESSAGE" } };
    }
    const sent = await deps.sendMessage({ content });
    return { result: { ok: true, messageId: sent.messageId } };
  }

  if (toolName === LIV_TOOL_CONFIRM_BOOKING) {
    if (!deps.confirmBooking) {
      return { result: { ok: false, error: "NOT_CONFIGURED" } };
    }
    try {
      const out = await deps.confirmBooking({ bookingId: String(toolInput.bookingId) });
      return { result: { ok: true, ...out }, bookingId: String(toolInput.bookingId) };
    } catch (err: unknown) {
      return bookingToolError(err instanceof Error ? err.message : String(err));
    }
  }

  if (toolName === LIV_TOOL_CANCEL_BOOKING) {
    if (!deps.cancelBooking) {
      return { result: { ok: false, error: "NOT_CONFIGURED" } };
    }
    try {
      const out = await deps.cancelBooking({
        bookingId: String(toolInput.bookingId),
        reason: toolInput.reason ? String(toolInput.reason) : undefined,
      });
      return { result: { ok: true, ...out } };
    } catch (err: unknown) {
      return bookingToolError(err instanceof Error ? err.message : String(err));
    }
  }

  if (toolName === LIV_TOOL_RESCHEDULE_BOOKING) {
    if (!deps.rescheduleBooking) {
      return { result: { ok: false, error: "NOT_CONFIGURED" } };
    }
    try {
      const out = await deps.rescheduleBooking({
        bookingId: String(toolInput.bookingId),
        startAt: String(toolInput.startAt),
      });
      return { result: { ok: true, ...out }, bookingId: String(toolInput.bookingId) };
    } catch (err: unknown) {
      return bookingToolError(err instanceof Error ? err.message : String(err));
    }
  }

  if (toolName === LIV_TOOL_MORNING_BRIEFING) {
    if (!deps.morningBriefing) {
      return { result: { ok: false, error: "NOT_CONFIGURED" } };
    }
    const out = await deps.morningBriefing();
    return { result: { ok: true, ...out } };
  }

  if (toolName === LIV_TOOL_LOOKUP_CUSTOMER) {
    if (!deps.lookupCustomer) {
      return { result: { ok: false, error: "NOT_CONFIGURED" } };
    }
    const out = await deps.lookupCustomer({ query: String(toolInput.query ?? "") });
    return { result: { ok: true, ...out } };
  }

  if (toolName === LIV_TOOL_GET_BOOKING) {
    if (!deps.getBooking) {
      return { result: { ok: false, error: "NOT_CONFIGURED" } };
    }
    const out = await deps.getBooking({ bookingId: String(toolInput.bookingId) });
    return { result: out };
  }

  if (toolName === LIV_TOOL_LIST_STUCK_CONTINUITY) {
    if (!deps.listStuckContinuity) {
      return { result: { ok: false, error: "NOT_CONFIGURED" } };
    }
    const limit = toolInput.limit ? parseInt(String(toolInput.limit), 10) : 10;
    const out = await deps.listStuckContinuity({
      limit: Number.isFinite(limit) ? limit : 10,
    });
    return { result: { ok: true, ...out } };
  }

  if (toolName === LIV_TOOL_SEARCH_TENANTS) {
    if (!deps.searchTenants) {
      return { result: { ok: false, error: "NOT_CONFIGURED" } };
    }
    const limit = toolInput.limit ? parseInt(String(toolInput.limit), 10) : undefined;
    const out = await deps.searchTenants({
      q: String(toolInput.q ?? ""),
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return { result: { ok: true, ...out } };
  }

  if (toolName === LIV_TOOL_TENANT_SNAPSHOT) {
    if (!deps.tenantSnapshot) {
      return { result: { ok: false, error: "NOT_CONFIGURED" } };
    }
    const out = await deps.tenantSnapshot({ businessId: String(toolInput.businessId) });
    return { result: out };
  }

  return { result: { ok: false, error: "UNKNOWN_TOOL" } };
}
