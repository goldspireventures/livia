import { usePersonaBriefing } from "@/hooks/use-persona-briefing";
import { PERSONA_ACCENT } from "@/lib/persona";
import { Link } from "wouter";

/** Role-aware strip at top of Settings — what this persona configures here. */
export function PersonaSettingsBanner() {
  const { persona, ritual, livLine } = usePersonaBriefing();
  const accent = PERSONA_ACCENT[persona];

  const hints: Record<string, string> = {
    org_admin: "Brand, billing, and integrations apply per location — switch location in the sidebar.",
    owner: "Your business voice, plan, and public booking link live here.",
    manager: "AI tone and comms — refunds and queue are in Inbox.",
    staff: "Profile and notifications only; roster changes are manager-only.",
    receptionist: "Comms and booking defaults — calendar stays on The floor.",
  };

  return (
    <div
      className="rounded-xl border p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
      style={{ borderColor: `${accent}44`, background: `${accent}0a` }}
    >
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
          Settings · {ritual.homeTitle}
        </p>
        <p className="text-sm text-foreground/90">{hints[persona]}</p>
        <p className="text-xs text-muted-foreground mt-1 italic">{livLine}</p>
      </div>
      <Link href="/launch-status">
        <span className="text-xs text-primary font-medium whitespace-nowrap">Launch checklist →</span>
      </Link>
    </div>
  );
}
