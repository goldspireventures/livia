import { Check } from "lucide-react";

export type DemoFlowStep = "setup" | "scenario" | "role";

const STEPS: Array<{ id: DemoFlowStep; label: string; hint: string }> = [
  { id: "setup", label: "Set up", hint: "Seed demo data + logins" },
  { id: "scenario", label: "Pick scenario", hint: "Solo, chain, franchise…" },
  { id: "role", label: "Enter as role", hint: "Owner, manager, desk, staff" },
];

type Props = {
  current: DemoFlowStep;
  provisioned: boolean;
  scenarioSelected: boolean;
};

function stepIndex(step: DemoFlowStep): number {
  return STEPS.findIndex((s) => s.id === step);
}

export function DemoFlowStepper({ current, provisioned, scenarioSelected }: Props) {
  const currentIdx = stepIndex(current);

  return (
    <nav
      aria-label="Demo walkthrough steps"
      className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
      data-testid="demo-flow-stepper"
    >
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => {
          const done =
            (step.id === "setup" && provisioned) ||
            (step.id === "scenario" && scenarioSelected) ||
            (step.id === "role" && false);
          const active = step.id === current;
          const reachable =
            step.id === "setup" ||
            (step.id === "scenario" && provisioned) ||
            (step.id === "role" && provisioned && scenarioSelected);

          return (
            <li
              key={step.id}
              className={`rounded-xl border px-3 py-2.5 transition-colors ${
                active
                  ? "border-[#06b6d4]/50 bg-[#06b6d4]/10"
                  : done
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : reachable
                      ? "border-white/15 bg-white/[0.02]"
                      : "border-white/8 bg-transparent opacity-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    done
                      ? "bg-emerald-500/20 text-emerald-300"
                      : active
                        ? "bg-[#06b6d4] text-black"
                        : "bg-white/10 text-white/60"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{step.label}</p>
                  <p className="text-[10px] text-white/45 truncate">{step.hint}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {currentIdx >= 0 ? (
        <p className="mt-3 text-[11px] text-white/40 font-mono">
          Step {currentIdx + 1} of {STEPS.length}
          {current === "setup" && !provisioned ? " · first setup can take up to a minute" : null}
          {current === "setup" && provisioned ? " · use quick sync unless you need a full reset" : null}
        </p>
      ) : null}
    </nav>
  );
}
