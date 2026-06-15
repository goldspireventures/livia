import { ArrowRight, Heart } from "lucide-react";
import { DEMO_GUEST_CLIENT_COPY, GUEST_HUB_COPY } from "@workspace/policy";
import { cn } from "@/lib/utils";

type Props = {
  openHref: string;
  /** Compact row inside wedge enter card */
  embedded?: boolean;
  className?: string;
};

/** G1 / G3 — guest client path into My Livia (always opens in a new tab). */
export function DemoGuestClientShortcut({ openHref, embedded, className }: Props) {
  return (
    <section
      className={cn(
        embedded
          ? "rounded-lg border border-white/12 bg-white/[0.04] p-3"
          : "mb-6 rounded-lg border border-white/12 bg-white/[0.04] p-4 sm:p-5",
        className,
      )}
      data-testid="demo-guest-client-shortcut"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/45">
            <Heart className="h-3 w-3 text-rose-300/80" aria-hidden />
            {GUEST_HUB_COPY.productName} · guest
          </p>
          <p className={cn("font-medium text-white", embedded ? "text-sm" : "text-base")}>
            {DEMO_GUEST_CLIENT_COPY.title}
          </p>
          {!embedded ? (
            <p className="text-xs text-white/55 max-w-xl leading-relaxed">{DEMO_GUEST_CLIENT_COPY.body}</p>
          ) : (
            <p className="text-[11px] text-white/50">{DEMO_GUEST_CLIENT_COPY.phoneHint}</p>
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
          data-testid="demo-guest-client-open"
        >
          {DEMO_GUEST_CLIENT_COPY.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </section>
  );
}
