import { ArrowRight, Globe } from "lucide-react";
import { DEMO_CONSULT_FIRST_GUEST_COPY } from "@workspace/policy";
import { cn } from "@/lib/utils";

type Props = {
  openHref: string;
  embedded?: boolean;
  className?: string;
};

/** G3 — guest path for consult-first verticals (public enquire, not My Livia). */
export function DemoConsultFirstGuestShortcut({ openHref, embedded, className }: Props) {
  return (
    <section
      className={cn(
        embedded
          ? "rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-amber-950/25 to-transparent p-4"
          : "mb-8 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/12 via-amber-950/20 to-transparent p-5 sm:p-6",
        className,
      )}
      data-testid="demo-consult-first-guest-shortcut"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-200/80">
            <Globe className="h-3.5 w-3.5" aria-hidden />
            Public website · guest path
          </p>
          <h2 className={cn("font-medium text-white", embedded ? "text-base" : "text-lg sm:text-xl")}>
            {DEMO_CONSULT_FIRST_GUEST_COPY.title}
          </h2>
          <p className={cn("text-white/65 leading-relaxed", embedded ? "text-xs" : "text-sm max-w-xl")}>
            {DEMO_CONSULT_FIRST_GUEST_COPY.body}
          </p>
          <p className="text-[10px] text-white/45">{DEMO_CONSULT_FIRST_GUEST_COPY.hint}</p>
        </div>
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-amber-400/90 px-5 py-3 text-sm font-semibold text-amber-950 hover:bg-amber-300 min-h-[44px] w-full sm:w-auto",
            embedded && "min-h-[40px] px-4 py-2.5 text-xs",
          )}
          data-testid="demo-consult-first-guest-open"
        >
          {DEMO_CONSULT_FIRST_GUEST_COPY.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
      <p className="mt-2 text-[10px] text-white/35 font-mono">
        Opens in a new tab — keep this screen open to try staff roles too
      </p>
    </section>
  );
}
