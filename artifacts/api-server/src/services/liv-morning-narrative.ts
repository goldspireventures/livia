import { getAnthropic, isAnthropicConfigured } from "@workspace/integrations-anthropic-ai";
import { businessVocabulary } from "@workspace/policy";
import { logger } from "../lib/logger";
import type { MorningBriefingContent } from "./morning-briefing.service";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export type LivNarrativeInput = {
  businessName: string;
  vertical: string | null;
  category: string | null;
  timezone: string;
  briefingDate: string;
  facts: MorningBriefingContent;
};

export type LivNarrativeResult = {
  summary: string;
  highlights: string[];
  model: string;
};

function parseNarrativeJson(raw: string): { summary: string; highlights: string[] } | null {
  const trimmed = raw.trim();
  const block = trimmed.match(/\{[\s\S]*\}/);
  if (!block) return null;
  try {
    const parsed = JSON.parse(block[0]) as { summary?: string; highlights?: unknown };
    if (!parsed.summary || typeof parsed.summary !== "string") return null;
    const highlights = Array.isArray(parsed.highlights)
      ? parsed.highlights.filter((h): h is string => typeof h === "string").slice(0, 5)
      : [];
    return { summary: parsed.summary.trim(), highlights };
  } catch {
    return null;
  }
}

/**
 * Liv-authored morning digest for one business — uses real operational facts only.
 */
export async function synthesizeLivMorningNarrative(
  input: LivNarrativeInput,
): Promise<LivNarrativeResult | null> {
  if (!isAnthropicConfigured()) return null;

  const vocab = businessVocabulary(input.vertical, input.category);
  const factsJson = {
    businessName: input.businessName,
    vertical: vocab.label,
    briefingDate: input.briefingDate,
    timezone: input.timezone,
    stats: input.facts.stats,
    todayBookings: input.facts.todayBookings.map((b) => ({
      time: b.startAt,
      status: b.status,
      customer: b.customerName,
      service: b.serviceName,
    })),
  };

  const system = `You are Liv, the operating intelligence for ${input.businessName} (${vocab.label}).
Write a morning briefing for the owner or manager. Use ONLY the JSON facts — never invent bookings, clients, or numbers.
Return valid JSON only: {"summary":"...","highlights":["...","..."]}
- summary: 1-2 sentences, MUST include the business name "${input.businessName}", calm and specific.
- highlights: 2-4 bullets; use client/service names and times from facts when present; use ${vocab.serviceNoun}/${vocab.clientNoun} vocabulary.
- If quiet day, say so clearly for THIS business only.`;

  try {
    const response = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 512,
      temperature: 0.35,
      system,
      messages: [
        {
          role: "user",
          content: `Operational facts:\n${JSON.stringify(factsJson, null, 2)}`,
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");

    const parsed = parseNarrativeJson(text);
    if (!parsed) {
      logger.warn({ businessName: input.businessName }, "Liv morning briefing: invalid JSON from model");
      return null;
    }

    return { ...parsed, model: MODEL };
  } catch (err) {
    logger.warn({ err, businessName: input.businessName }, "Liv morning briefing synthesis failed");
    return null;
  }
}

export async function synthesizeOrgAdminPortfolioLine(args: {
  shopCount: number;
  shopsNeedingAttention: number;
  attentionNames: string[];
  bookingsThisWeek: number;
  shops: Array<{ name: string; pulseStatus: string; todayBookings: number; pendingBookings: number }>;
}): Promise<string | null> {
  if (!isAnthropicConfigured() || args.shopCount === 0) return null;

  try {
    const response = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 200,
      temperature: 0.3,
      system: `You are Liv speaking to an org admin overseeing multiple locations. One sentence only. Use only the facts given.`,
      messages: [
        {
          role: "user",
          content: JSON.stringify(args),
        },
      ],
    });
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
