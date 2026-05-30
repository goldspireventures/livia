import { getSupportPoint } from "@workspace/policy";

export type SupportTriage = {
  priority: "urgent" | "normal" | "low";
  tags: string[];
  suggestedReply: string;
};

const TAG_PATTERNS: Array<{ tag: string; re: RegExp }> = [
  { tag: "billing", re: /\b(stripe|invoice|subscription|payment|charge|refund)\b/i },
  { tag: "liv", re: /\b(liv|ai|bot|assistant|wrong reply)\b/i },
  { tag: "booking", re: /\b(booking|calendar|slot|no-?show|reschedule)\b/i },
  { tag: "leave", re: /\b(leave|time off|rota|holiday|pto)\b/i },
  { tag: "running_late", re: /\b(running late|late broadcast)\b/i },
  { tag: "vertical_copy", re: /\b(shop|salon|practice|vertical|wording|label)\b/i },
  { tag: "sms", re: /\b(sms|text message|twilio)\b/i },
];

export function triageSupportTicket(input: {
  category: string;
  description: string;
  severity?: string;
  context?: { surfaceId?: string; route?: string };
}): SupportTriage {
  const text = input.description.trim();
  const lower = text.toLowerCase();
  const tags = new Set<string>([input.category]);

  for (const { tag, re } of TAG_PATTERNS) {
    if (re.test(text)) tags.add(tag);
  }

  const surfaceId = input.context?.surfaceId?.trim();
  const point = surfaceId ? getSupportPoint(surfaceId) : undefined;
  if (surfaceId) tags.add(`surface:${surfaceId}`);
  if (point?.owner) tags.add(`owner:${point.owner}`);

  let priority: SupportTriage["priority"] = "normal";
  if (input.severity === "blocking" || input.category === "billing") {
    priority = "urgent";
  } else if (input.category === "feature" || input.severity === "nice_to_have") {
    priority = "low";
  }
  if (tags.has("liv") && /\b(blocking|broken|can't|cannot|down)\b/i.test(lower)) {
    priority = "urgent";
  }

  let suggestedReply =
    point?.suggestedReply ??
    "See docs/business/OPERATOR-READY-PACK.md for the matching workflow starter.";
  if (tags.has("billing")) {
    suggestedReply =
      "Check Settings → Billing and Stripe status on the tenant health card; share the billing portal link.";
  } else if (tags.has("liv")) {
    suggestedReply =
      "Settings → Liv tone and tool catalog; compare thread with Take over once on the conversation.";
  } else if (tags.has("leave")) {
    suggestedReply = "templates/leave-and-rota.md + workflows/time-off-request.md in the operator pack.";
  } else if (tags.has("running_late")) {
    suggestedReply = "templates/running-late-procedure.md — Today, Floor, or guest visit link.";
  } else if (tags.has("vertical_copy")) {
    suggestedReply =
      "Confirm business vertical in Settings; allied-health should show Practice, not Shop.";
  } else if (tags.has("booking")) {
    suggestedReply = "Open booking detail continuity timeline; check pending queue and Liv policy caps.";
  }

  return {
    priority,
    tags: [...tags],
    suggestedReply,
  };
}
