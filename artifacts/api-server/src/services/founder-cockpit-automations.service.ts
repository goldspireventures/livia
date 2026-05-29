import {
  findStuckOnboardingBusinesses,
  sendOnboardingStuckNudges,
} from "./onboarding-nudge.service.js";
import { runFounderProductionChecks } from "./founder-cockpit-command-center.service.js";

export type ExecAutomationDef = {
  id: string;
  label: string;
  description: string;
  role: "exec" | "engineer";
  /** Requires explicit confirm in UI before run */
  destructive?: boolean;
};

export const EXEC_AUTOMATIONS: ExecAutomationDef[] = [
  {
    id: "refresh-production-checks",
    label: "Refresh production checks",
    description: "Re-run live probes (API, app rewrite, Clerk CNAME).",
    role: "exec",
  },
  {
    id: "scan-onboarding-stuck",
    label: "Scan stuck onboarding",
    description: "List businesses >48h in onboarding with <50% progress (no emails).",
    role: "exec",
  },
  {
    id: "nudge-onboarding-stuck",
    label: "Email stuck onboarding nudges",
    description: "Send Resend nudges to owners of stuck businesses.",
    role: "exec",
    destructive: true,
  },
];

export async function runExecAutomation(
  id: string,
  opts: { confirm?: boolean },
): Promise<{ ok: boolean; summary: string; detail?: unknown }> {
  switch (id) {
    case "refresh-production-checks": {
      const result = await runFounderProductionChecks();
      return {
        ok: result.allRequiredOk,
        summary: result.allRequiredOk
          ? "All required production checks passed."
          : "One or more required production checks failed.",
        detail: result,
      };
    }
    case "scan-onboarding-stuck": {
      const stuck = await findStuckOnboardingBusinesses();
      return {
        ok: true,
        summary: `${stuck.length} stuck onboarding business(es).`,
        detail: stuck.map((s) => ({
          slug: s.slug,
          name: s.name,
          percentComplete: s.percentComplete,
          currentAct: s.currentAct,
        })),
      };
    }
    case "nudge-onboarding-stuck": {
      if (!opts.confirm) {
        return {
          ok: false,
          summary: "Confirm required — this sends real emails.",
        };
      }
      const nudge = await sendOnboardingStuckNudges();
      return {
        ok: true,
        summary: `Nudges emailed: ${nudge.emailed}, skipped: ${nudge.skipped}, failed: ${nudge.failed}.`,
        detail: nudge,
      };
    }
    default:
      return { ok: false, summary: `Unknown automation: ${id}` };
  }
}
