/**
 * @workspace/eval
 *
 * The eval framework (per ADR 0016, ADR 0018 unit #7).
 *
 * Three layers:
 *   1. Pre-merge eval — every PR runs the suite for affected workflows;
 *      no merge if any persona-vertical-locale cell regresses.
 *   2. Online sampled eval — N% of production traces are scored against
 *      rubrics; thresholds trigger alerts.
 *   3. "Liv was wrong" rollback class — auto-rollback for a known-bad
 *      class of outputs; human-approved rollback for everything else.
 *
 * v1: trace store + scoring lives inside Livia.
 * v1.5+: extractable as a hosted product for other AI agent builders.
 */
export * from "./schema";
export { PRE_MERGE_GOLDEN_CHECKS, type GoldenCheck } from "./golden";

export interface EvalRubricScore {
  rubricKey: string;
  score: number; // 0..1
  rationale?: string;
}

export interface EvalTraceInput {
  suite: string;
  scenario: string;
  layer: "PRE_MERGE" | "ONLINE_SAMPLED" | "ROLLBACK_CLASS";
  persona?: string;
  vertical?: string;
  locale?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  inputScrubbed: unknown;
  outputScrubbed: unknown;
  rubricScores: EvalRubricScore[];
  livRuntimeRef?: string;
}

export type RollbackClass = "DETERMINISTIC" | "POLICY_VIOLATION" | "AGENT_LOOP" | "UNKNOWN";

export interface RollbackDecision {
  shouldRollback: boolean;
  rollbackClass: RollbackClass;
  reason: string;
  requiresHumanApproval: boolean;
}
