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
          ? "rounded-lg border border-white/12 bg-white/[0.04] p-3"
          : "mb-6 rounded-lg border border-white/12 bg-white/[0.04] p-4 sm:p-5",
        className,
      )}
      data-testid="demo-consult-first-guest-shortcut"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/45">
            <Globe className="h-3 w-3 text-amber-200/80" aria-hidden />
            Public website · guest
          </p>
          <p className={cn("font-medium text-white", embedded ? "text-sm" : "text-base")}>
            {DEMO_CONSULT_FIRST_GUEST_COPY.title}
          </p>
          {!embedded ? (
            <p className="text-xs text-white/55 max-w-xl leading-relaxed">
              {DEMO_CONSULT_FIRST_GUEST_COPY.body}
            </p>
          ) : (
            <p className="text-[11px] text-white/50">{DEMO_CONSULT_FIRST_GUEST_COPY.hint}</p>
          )}
        </div>
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15 min-h-[44px] w-full sm:w-auto",
            embedded && "min-h-[40px] text-xs",
          )}
          data-testid="demo-consult-first-guest-open"
        >
          {DEMO_CONSULT_FIRST_GUEST_COPY.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </section>
  );
}
