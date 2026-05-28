import { db, evalsTracesTable } from "@workspace/db";
import { LIV_RUNTIME_REF } from "@workspace/liv-runtime";
import { generateId } from "./id";

export async function recordEvalTraceForTool(args: {
  businessId: string;
  suite: string;
  scenario: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolResult: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(evalsTracesTable).values({
      id: generateId(),
      businessId: args.businessId,
      suite: args.suite,
      scenario: args.scenario,
      layer: "PRE_MERGE",
      outcome: "PASS",
      inputScrubbed: { tool: args.toolName, input: args.toolInput },
      outputScrubbed: args.toolResult,
      rubricScores: [{ rubricKey: `tool.${args.toolName}`, score: 1 }],
      livRuntimeRef: LIV_RUNTIME_REF,
      metadata: { source: "liv-tool-side-effect" },
    });
  } catch (err) {
    // Eval persistence must not break customer-facing booking.
    console.error("[eval-traces] failed to persist tool trace", err);
  }
}
