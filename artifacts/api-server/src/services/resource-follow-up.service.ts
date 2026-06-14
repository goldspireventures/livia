/**
 * Resource follow-up sweep — policy rules × per-resource adapters (any vertical).
 */
import { and, eq, lt } from "drizzle-orm";
import { db, designProofAssetsTable, businessesTable } from "@workspace/db";
import {
  RESOURCE_FOLLOW_UP_RULES,
  buildFollowUpNudgeCopy,
  isSubsystemEnabled,
  resolveSideEffectMode,
  stripDesignProofGuestFeedback,
  parseDesignProofGuestFeedback,
  type ResourceFollowUpRule,
} from "@workspace/policy";
import { isSubsystemCircuitOpen } from "../lib/subsystem-circuit";
import { emitPlatformNotification } from "./resource-transition.service";
import { ensureDesignProofGuestAccess } from "./design-proof-guest-access.service";
import { resolveGuestTokenUrl } from "../lib/guest-public-urls";

function proofTitle(note?: string | null): string {
  const raw = stripDesignProofGuestFeedback(note) || "Studio design";
  const idx = raw.indexOf(" — ");
  return idx > 0 ? raw.slice(0, idx).trim() : raw.trim();
}

async function runDesignProofFollowUp(rule: ResourceFollowUpRule): Promise<{
  clientNudges: number;
  clientClosed: number;
  studioReminders: number;
}> {
  let clientNudges = 0;
  let clientClosed = 0;
  let studioReminders = 0;
  const now = Date.now();

  if (rule.nudgeAfterDays != null || rule.autoCloseAfterDays != null) {
    const nudgeCutoff = rule.nudgeAfterDays
      ? new Date(now - rule.nudgeAfterDays * 86400000)
      : null;
    const closeCutoff = rule.autoCloseAfterDays
      ? new Date(now - rule.autoCloseAfterDays * 86400000)
      : null;

    const pending = await db
      .select({
        id: designProofAssetsTable.id,
        businessId: designProofAssetsTable.businessId,
        note: designProofAssetsTable.note,
        version: designProofAssetsTable.version,
        updatedAt: designProofAssetsTable.updatedAt,
        slug: businessesTable.slug,
      })
      .from(designProofAssetsTable)
      .innerJoin(businessesTable, eq(designProofAssetsTable.businessId, businessesTable.id))
      .where(eq(designProofAssetsTable.status, rule.watchStatus));

    for (const row of pending) {
      if (closeCutoff && row.updatedAt < closeCutoff && rule.autoCloseToStatus) {
        const suffix = (rule.autoCloseNoteSuffix ?? "").replace(
          "{days}",
          String(rule.autoCloseAfterDays ?? 0),
        );
        await db
          .update(designProofAssetsTable)
          .set({
            status: rule.autoCloseToStatus,
            note: row.note
              ? `${stripDesignProofGuestFeedback(row.note) ?? row.note}\n\n${suffix}`
              : suffix,
            updatedAt: new Date(),
          })
          .where(eq(designProofAssetsTable.id, row.id));
        clientClosed += 1;
        continue;
      }
      if (nudgeCutoff && rule.nudgeKind && row.updatedAt < nudgeCutoff) {
        const token = await ensureDesignProofGuestAccess(row.businessId, row.id);
        const reviewUrl = resolveGuestTokenUrl(row.slug, "proof", token);
        const copy = buildFollowUpNudgeCopy({
          kind: rule.nudgeKind,
          displayLabel: proofTitle(row.note),
          days: rule.nudgeAfterDays ?? 0,
          guestLink: reviewUrl,
        });
        await emitPlatformNotification({
          kind: rule.nudgeKind,
          businessId: row.businessId,
          resourceKind: "design_proof",
          resourceId: row.id,
          title: copy.title,
          body: copy.body,
          priority: "watch",
          audience: "operators",
          dedupeKey: `design-proof:${row.id}:client-nudge:v${row.version ?? 1}`,
        });
        clientNudges += 1;
      }
    }
  }

  if (
    rule.secondaryWatchStatus &&
    rule.secondaryNudgeAfterDays != null &&
    rule.secondaryNudgeKind
  ) {
    const studioCutoff = new Date(now - rule.secondaryNudgeAfterDays * 86400000);
    const rejected = await db
      .select({
        id: designProofAssetsTable.id,
        businessId: designProofAssetsTable.businessId,
        note: designProofAssetsTable.note,
        version: designProofAssetsTable.version,
        updatedAt: designProofAssetsTable.updatedAt,
      })
      .from(designProofAssetsTable)
      .innerJoin(businessesTable, eq(designProofAssetsTable.businessId, businessesTable.id))
      .where(
        and(
          eq(designProofAssetsTable.status, rule.secondaryWatchStatus),
          lt(designProofAssetsTable.updatedAt, studioCutoff),
        ),
      );

    for (const row of rejected) {
      const copy = buildFollowUpNudgeCopy({
        kind: rule.secondaryNudgeKind,
        displayLabel: proofTitle(row.note),
        days: rule.secondaryNudgeAfterDays,
        guestFeedback: parseDesignProofGuestFeedback(row.note),
      });
      await emitPlatformNotification({
        kind: rule.secondaryNudgeKind,
        businessId: row.businessId,
        resourceKind: "design_proof",
        resourceId: row.id,
        title: copy.title,
        body: copy.body,
        priority: "watch",
        audience: "operators",
        dedupeKey: `design-proof:${row.id}:studio-nudge:v${row.version ?? 1}`,
      });
      studioReminders += 1;
    }
  }

  return { clientNudges, clientClosed, studioReminders };
}

const FOLLOW_UP_RUNNERS: Partial<
  Record<ResourceFollowUpRule["resourceKind"], (rule: ResourceFollowUpRule) => Promise<Record<string, number>>>
> = {
  design_proof: runDesignProofFollowUp,
};

export async function runResourceFollowUpSweep(): Promise<Record<string, number>> {
  const totals: Record<string, number> = { skipped: 0 };

  if (
    !isSubsystemEnabled("notifications", resolveSideEffectMode()) ||
    isSubsystemCircuitOpen("notifications")
  ) {
    totals.skipped = 1;
    return totals;
  }

  for (const rule of RESOURCE_FOLLOW_UP_RULES) {
    const runner = FOLLOW_UP_RUNNERS[rule.resourceKind];
    if (!runner) continue;
    const result = await runner(rule);
    for (const [k, v] of Object.entries(result)) {
      totals[k] = (totals[k] ?? 0) + v;
    }
  }
  return totals;
}
