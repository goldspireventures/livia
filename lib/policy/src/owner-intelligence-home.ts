/**
 * Owner-intelligence home surface — when to show consolidated stack vs empty.
 */

export type OwnerIntelHomeInput = {
  remediationTasks?: Array<{ severity: string }>;
  commerce?: {
    topSignal?: { severity: string } | null;
    signals?: Array<{ severity: string }>;
  };
  commerceCapabilityBlockers?: unknown[];
  capabilityBlockers?: number;
  twinHeadline?: string | null;
  twinTopRecommendation?: unknown;
  livPrompts?: string[];
  capabilityHealth?: { score: number; grade?: string };
  twinObservations?: unknown[];
  twinRisks?: unknown[];
  twinOpportunities?: unknown[];
};

/** True when any owner-intelligence slice has content worth rendering. */
export function ownerIntelligenceHasSurfaceContent(
  intel: OwnerIntelHomeInput | null | undefined,
): boolean {
  if (!intel) return false;
  const top = intel.commerce?.topSignal;
  const tasks = intel.remediationTasks ?? [];
  const blockers = intel.commerceCapabilityBlockers ?? [];
  const actionable = intel.commerce?.signals?.filter((s) => s.severity !== "info") ?? [];
  const health = intel.capabilityHealth;
  return (
    top != null ||
    tasks.length > 0 ||
    blockers.length > 0 ||
    intel.twinHeadline != null ||
    intel.twinTopRecommendation != null ||
    (intel.livPrompts?.length ?? 0) > 0 ||
    (intel.twinObservations?.length ?? 0) > 0 ||
    (intel.twinRisks?.length ?? 0) > 0 ||
    (intel.twinOpportunities?.length ?? 0) > 0 ||
    (health != null && health.score < 85) ||
    actionable.length > 0
  );
}

export type OwnerIntelligenceActionRow = {
  id: string;
  title: string;
  body: string;
  href: string;
  severity: "act" | "watch" | "info";
  source: "commerce" | "remediation" | "risk" | "observation" | "opportunity" | "recommendation";
};

function normalizeIntelligenceTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** One primary row + a short deduped "more" list — avoids repeating the same signal six times. */
export function buildCompactOwnerIntelligenceRows(
  intel: OwnerIntelHomeInput & {
    remediationTasks?: Array<{
      signalId: string;
      severity: string;
      title: string;
      body: string;
      href: string;
    }>;
    commerce?: OwnerIntelHomeInput["commerce"] & {
      topSignal?: {
        id?: string;
        severity: string;
        title: string;
        body: string;
        href: string;
      } | null;
    };
    twinTopRecommendation?: {
      title: string;
      reason: string;
      href?: string;
    } | null;
    twinObservations?: Array<{
      id: string;
      title: string;
      body: string;
      href?: string | null;
      severity?: string;
    }>;
    twinRisks?: Array<{
      id: string;
      title: string;
      body: string;
      href?: string | null;
      severity?: string;
    }>;
    twinOpportunities?: Array<{
      id: string;
      title: string;
      body: string;
      href?: string | null;
      severity?: string;
    }>;
  },
): { primary: OwnerIntelligenceActionRow | null; more: OwnerIntelligenceActionRow[] } {
  const seen = new Set<string>();
  const rows: OwnerIntelligenceActionRow[] = [];

  const push = (row: OwnerIntelligenceActionRow) => {
    const key = normalizeIntelligenceTitle(row.title);
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  const top = intel.commerce?.topSignal;
  if (top) {
    push({
      id: top.id ?? "commerce-top",
      title: top.title,
      body: top.body,
      href: top.href,
      severity: top.severity === "act" ? "act" : top.severity === "watch" ? "watch" : "info",
      source: "commerce",
    });
  }

  for (const task of intel.remediationTasks ?? []) {
    push({
      id: task.signalId,
      title: task.title,
      body: task.body,
      href: task.href,
      severity: task.severity === "act" ? "act" : task.severity === "watch" ? "watch" : "info",
      source: "remediation",
    });
  }

  for (const risk of intel.twinRisks ?? []) {
    push({
      id: risk.id,
      title: risk.title,
      body: risk.body,
      href: risk.href ?? "/dashboard",
      severity: "act",
      source: "risk",
    });
  }

  for (const obs of intel.twinObservations ?? []) {
    push({
      id: obs.id,
      title: obs.title,
      body: obs.body,
      href: obs.href ?? "/dashboard",
      severity: obs.severity === "act" ? "act" : obs.severity === "watch" ? "watch" : "info",
      source: "observation",
    });
  }

  const rec = intel.twinTopRecommendation;
  if (rec) {
    push({
      id: "twin-rec",
      title: rec.title,
      body: rec.reason,
      href: rec.href ?? "/dashboard",
      severity: "watch",
      source: "recommendation",
    });
  }

  for (const opp of intel.twinOpportunities ?? []) {
    push({
      id: opp.id,
      title: opp.title,
      body: opp.body,
      href: opp.href ?? "/dashboard",
      severity: "info",
      source: "opportunity",
    });
  }

  const sorted = rows.sort((a, b) => {
    const rank = (s: OwnerIntelligenceActionRow["severity"]) =>
      s === "act" ? 0 : s === "watch" ? 1 : 2;
    return rank(a.severity) - rank(b.severity);
  });

  return {
    primary: sorted[0] ?? null,
    more: sorted.slice(1, 4),
  };
}

/** How many Liv moment cards on owner home — consult-first stays minimal. */
export function resolveLivMomentsHomeCap(vertical?: string | null): number {
  if (vertical === "event-vendors") return 1;
  return 2;
}

/** Liv moments strip — hide when owner-intelligence already surfaces the same titles. */
export function dedupeLivMomentsByTitle<T extends { title: string }>(
  moments: T[],
  max = 2,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const m of moments) {
    const key = normalizeIntelligenceTitle(m.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(m);
    if (out.length >= max) break;
  }
  return out;
}

/** Rows that explain the Settings nav badge — same sources as ownerIntelligenceActSignalCount. */
export function buildSettingsAttentionRows(intel: unknown): OwnerIntelligenceActionRow[] {
  const data = intel as OwnerIntelHomeInput & {
    remediationTasks?: Array<{
      signalId: string;
      severity: string;
      title: string;
      body: string;
      href: string;
    }>;
    commerceCapabilityBlockers?: Array<{
      capabilityId: string;
      capabilityName: string;
      blocker: string;
      href: string;
    }>;
    commerce?: {
      signals?: Array<{
        id?: string;
        severity: string;
        title: string;
        body: string;
        href: string;
      }>;
      topSignal?: {
        id?: string;
        severity: string;
        title: string;
        body: string;
        href: string;
      } | null;
    };
    twinRisks?: Array<{
      id: string;
      title: string;
      body: string;
      href?: string | null;
    }>;
    twinObservations?: Array<{
      id: string;
      title: string;
      body: string;
      href?: string | null;
      severity?: string;
    }>;
    twinTopRecommendation?: {
      title: string;
      reason: string;
      href?: string;
    } | null;
  };

  if (!data) return [];

  const seen = new Set<string>();
  const rows: OwnerIntelligenceActionRow[] = [];
  const push = (row: OwnerIntelligenceActionRow) => {
    const key = normalizeIntelligenceTitle(row.title);
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  for (const blocker of data.commerceCapabilityBlockers ?? []) {
    push({
      id: `cap-${blocker.capabilityId}`,
      title: blocker.capabilityName,
      body: blocker.blocker,
      href: blocker.href,
      severity: "act",
      source: "remediation",
    });
  }

  for (const signal of (
    data.commerce?.signals as
      | Array<{
          id?: string;
          severity: string;
          title: string;
          body: string;
          href: string;
        }>
      | undefined
  )?.filter((s) => s.severity === "act") ?? []) {
    push({
      id: signal.id ?? `commerce-${rows.length}`,
      title: signal.title,
      body: signal.body,
      href: signal.href,
      severity: "act",
      source: "commerce",
    });
  }

  const compact = buildCompactOwnerIntelligenceRows(data as never);
  if (compact.primary && compact.primary.severity !== "info") {
    push(compact.primary);
  }
  for (const row of compact.more) {
    if (row.severity !== "info") push(row);
  }

  const rank = (s: OwnerIntelligenceActionRow["severity"]) =>
    s === "act" ? 0 : s === "watch" ? 1 : 2;
  return rows.sort((a, b) => rank(a.severity) - rank(b.severity)).slice(0, 5);
}

/** Count of act-severity items across commerce + remediation + setup blockers. */
export function ownerIntelligenceActSignalCount(
  intel: OwnerIntelHomeInput | null | undefined,
): number {
  if (!intel) return 0;
  const commerceAct =
    (intel.remediationTasks?.filter((t) => t.severity === "act").length ?? 0) +
    (intel.commerce?.topSignal?.severity === "act" ? 1 : 0) +
    (intel.commerce?.signals?.filter((s) => s.severity === "act").length ?? 0);
  const setupAct = intel.commerceCapabilityBlockers?.length ?? 0;
  const twinAct = intel.twinRisks?.length ?? 0;
  return commerceAct + setupAct + twinAct;
}
