import { ArrowRight, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { DEMO_FRESH_FOUNDER_COPY } from "@workspace/policy";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** G1 — fresh founder path (sign-up → legal → onboarding), distinct from demo roster. */
export function DemoFreshFounderShortcut({ className }: Props) {
  return (
    <section
      className={cn(
        "mb-6 rounded-xl border border-primary/35 bg-gradient-to-r from-primary/12 via-primary/5 to-transparent px-4 py-3.5 sm:px-5 sm:py-4",
        className,
      )}
      data-testid="demo-fresh-founder-shortcut"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-primary/90">
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            {DEMO_FRESH_FOUNDER_COPY.kicker}
          </p>
          <p className="text-sm font-medium text-white sm:text-base">{DEMO_FRESH_FOUNDER_COPY.title}</p>
          <p className="text-xs leading-relaxed text-white/60 max-w-2xl">{DEMO_FRESH_FOUNDER_COPY.body}</p>
          <p className="text-[10px] font-mono text-white/40">{DEMO_FRESH_FOUNDER_COPY.endClientHint}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/sign-up"
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            data-testid="demo-fresh-founder-sign-up"
          >
            {DEMO_FRESH_FOUNDER_COPY.ctaSignUp}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
            data-testid="demo-fresh-founder-onboarding"
          >
            {DEMO_FRESH_FOUNDER_COPY.ctaOnboarding}
          </Link>
        </div>
      </div>
    </section>
  );
}
