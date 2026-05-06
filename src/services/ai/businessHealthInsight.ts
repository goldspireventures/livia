import "server-only";

import { prisma } from "@/lib/prisma";

import { optionalChatCompletion } from "./aiClient";
import { recordAIInteraction } from "./aiInteractionService";

/**
 * Read-only aggregate for owner/admin (T5). Uses DB heuristics; optionally augments with LLM when configured.
 */
export async function getBusinessHealthInsight(input: { businessId: string; userId: string }) {
  const { businessId, userId } = input;
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [upcoming, pendingBookings, customerCount] = await Promise.all([
    prisma.booking.count({
      where: { businessId, startsAt: { gte: now }, status: { notIn: ["CANCELLED"] } },
    }),
    prisma.booking.count({
      where: { businessId, status: "PENDING", startsAt: { gte: from } },
    }),
    prisma.customer.count({ where: { businessId } }),
  ]);

  const baseline = `Last 7 days context: ${pendingBookings} pending booking(s) starting soon window, ${upcoming} upcoming (future) bookings, ${customerCount} customers on file.`;

  const started = Date.now();
  const llm = await optionalChatCompletion({
    system:
      "You are a Livia ops assistant. Reply with 2–4 short bullet lines of operational tips (no markdown headers). No PII. If data is thin, say what to configure next.",
    user: `BusinessId ${businessId}. ${baseline}`,
    maxTokens: 220,
  });
  const durationMs = Date.now() - started;

  let insight: string;
  if (llm.text && !llm.error) {
    insight = `${baseline}\n\n${llm.text}`;
  } else {
    insight =
      `${baseline}\n\n` +
      (llm.error === "no_api_key"
        ? "LLM: not configured (set OPENAI_API_KEY for optional narrative)."
        : `LLM: skipped (${llm.error ?? "unavailable"}).`);
  }

  await recordAIInteraction({
    businessId,
    userId,
    kind: "BUSINESS_HEALTH_INSIGHT",
    model: llm.model,
    promptSummary: "business_health_7d",
    responseSummary: insight.slice(0, 2000),
    error: llm.error,
    durationMs,
    metadata: { upcoming, pendingBookings, customerCount },
  }).catch((err) => {
    console.error("[recordAIInteraction]", err);
  });

  return {
    baseline,
    insight,
    llmUsed: Boolean(llm.text && !llm.error),
  };
}
