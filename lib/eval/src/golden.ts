import {
  LIV_TOOL_CREATE_BOOKING,
  LIV_TOOL_FIND_SLOTS,
  LIV_TOOLS,
  shouldLivUseTools,
} from "@workspace/liv-runtime";
import { guardChannelPackForProduction, isWhatsAppProvisioned, resolveChannelPack } from "@workspace/policy";

export type GoldenCheck = {
  name: string;
  run: () => void | Promise<void>;
};

/** Layer-1 pre-merge checks — no LLM calls, contract-only. */
export const PRE_MERGE_GOLDEN_CHECKS: GoldenCheck[] = [
  {
    name: "liv.tools includes find_slots and create_booking",
    run() {
      const names = LIV_TOOLS.map((t) => t.name);
      if (!names.includes(LIV_TOOL_FIND_SLOTS) || !names.includes(LIV_TOOL_CREATE_BOOKING)) {
        throw new Error(`Expected book tools; got ${names.join(", ")}`);
      }
    },
  },
  {
    name: "liv.handoff skips tools when not aiHandled",
    run() {
      if (shouldLivUseTools({ status: "OPEN", aiHandled: false })) {
        throw new Error("Liv must not use tools after human handoff");
      }
      if (shouldLivUseTools({ status: "HANDED_OFF", aiHandled: true })) {
        throw new Error("Liv must not use tools when conversation is HANDED_OFF");
      }
      if (!shouldLivUseTools({ status: "OPEN", aiHandled: true })) {
        throw new Error("Liv should use tools on open AI-handled threads");
      }
    },
  },
  {
    name: "channels.whatsapp disabled in production without credentials",
    run() {
      const esPack = guardChannelPackForProduction(resolveChannelPack("ES"), {
        NODE_ENV: "production",
      });
      if (esPack.whatsapp) {
        throw new Error("WhatsApp must be forced off in production without BSP credentials");
      }
      const withCreds = guardChannelPackForProduction(resolveChannelPack("ES"), {
        NODE_ENV: "production",
        WHATSAPP_ACCESS_TOKEN: "test-token",
      });
      if (!withCreds.whatsapp) {
        throw new Error("WhatsApp should stay enabled when credentials are present");
      }
      if (isWhatsAppProvisioned({ WHATSAPP_ACCESS_TOKEN: "x" }) !== true) {
        throw new Error("isWhatsAppProvisioned should detect access token");
      }
    },
  },
];
