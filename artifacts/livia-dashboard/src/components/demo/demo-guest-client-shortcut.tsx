import { ArrowRight, Heart } from "lucide-react";
import { DEMO_GUEST_CLIENT_COPY, GUEST_HUB_COPY } from "@workspace/policy";
import { cn } from "@/lib/utils";

type Props = {
  openHref: string;
  /** Compact row inside wedge enter card */
  embedded?: boolean;
  className?: string;
};

/** G1 — guest client path into My Livia (always opens in a new tab). */
export function DemoGuestClientShortcut({ openHref, embedded, className }: Props) {
  return (
    <section
      className={cn(
        embedded
          ? "rounded-xl border border-rose-400/40 bg-gradient-to-br from-rose-500/20 via-rose-950/25 to-transparent p-4"
          : "mb-8 rounded-2xl border border-rose-400/35 bg-gradient-to-br from-rose-500/15 via-rose-950/20 to-transparent p-5 sm:p-6",
        className,
      )}
      data-testid="demo-guest-client-shortcut"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-rose-200/80">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            {GUEST_HUB_COPY.productName} · end client
          </p>
          <h2 className={cn("font-medium text-white", embedded ? "text-base" : "text-lg sm:text-xl")}>
            {DEMO_GUEST_CLIENT_COPY.title}
          </h2>
          <p className={cn("text-white/65 leading-relaxed", embedded ? "text-xs" : "text-sm max-w-xl")}>
            {DEMO_GUEST_CLIENT_COPY.body}
          </p>
          {!embedded ? (
            <>
              <p className="text-xs text-white/45 font-mono">{DEMO_GUEST_CLIENT_COPY.phoneHint}</p>
              <p className="text-xs text-white/50">{DEMO_GUEST_CLIENT_COPY.nameHint}</p>
            </>
          ) : (
            <p className="text-[10px] text-white/45 font-mono">{DEMO_GUEST_CLIENT_COPY.phoneHint}</p>
          )}
        </div>
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-rose-400/90 px-5 py-3 text-sm font-semibold text-rose-950 hover:bg-rose-300 min-h-[44px] w-full sm:w-auto",
            embedded && "min-h-[40px] px-4 py-2.5 text-xs",
          )}
          data-testid="demo-guest-client-open"
        >
          {DEMO_GUEST_CLIENT_COPY.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
      <p className="mt-2 text-[10px] text-white/35 font-mono">
        Opens in a new tab — keep this screen open to try staff roles too
      </p>
    </section>
  );
}
