/**
 * Eval schema — production traces sampled for online eval (per ADR 0016).
 *
 * Three layers: pre-merge eval, online sampled eval, "Liv was wrong" rollback class.
 * This table holds the trace store; PII is scrubbed before persistence.
 */
import { pgTable, text, timestamp, integer, jsonb, boolean, pgEnum, index } from "drizzle-orm/pg-core";

export const evalLayerEnum = pgEnum("eval_layer", ["PRE_MERGE", "ONLINE_SAMPLED", "ROLLBACK_CLASS"]);
export const evalOutcomeEnum = pgEnum("eval_outcome", ["PASS", "FAIL", "FLAG_FOR_REVIEW", "ROLLED_BACK"]);

export const evalsTracesTable = pgTable(
  "evals_traces",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id"),
    /** Workflow / feature being evaluated (e.g., 'book.voice', 'refund.cap-ladder'). */
    suite: text("suite").notNull(),
    /** Specific scenario within the suite (e.g., 'P2b-CT4-drift-recovery'). */
    scenario: text("scenario").notNull(),
    layer: evalLayerEnum("layer").notNull(),
    /** Persona served (P2b, P3, P5, P7, etc. — per ADR 0009). */
    persona: text("persona"),
    /** Vertical context (hair, beauty, ...). */
    vertical: text("vertical"),
    /** Locale (en-IE, en-UK, etc.). */
    locale: text("locale"),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    latencyMs: integer("latency_ms"),
    outcome: evalOutcomeEnum("outcome").notNull(),
    /** PII-scrubbed input transcript. */
    inputScrubbed: jsonb("input_scrubbed"),
    /** PII-scrubbed output. */
    outputScrubbed: jsonb("output_scrubbed"),
    /** Per-eval rubric scoring. */
    rubricScores: jsonb("rubric_scores"),
    /** Whether this trace contributed to a per-tenant rollback decision. */
    contributedToRollback: boolean("contributed_to_rollback").notNull().default(false),
    /** Reference to the Liv runtime instance + version that produced the output. */
    livRuntimeRef: text("liv_runtime_ref"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("evals_traces_business_idx").on(t.businessId),
    index("evals_traces_suite_idx").on(t.suite, t.scenario),
    index("evals_traces_outcome_idx").on(t.outcome),
    index("evals_traces_created_idx").on(t.createdAt),
  ],
);

export type EvalsTrace = typeof evalsTracesTable.$inferSelect;
export type InsertEvalsTrace = typeof evalsTracesTable.$inferInsert;
