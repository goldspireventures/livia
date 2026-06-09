import { ArrowRight, Heart, Loader2 } from "lucide-react";
import { DEMO_GUEST_CLIENT_COPY, GUEST_HUB_COPY } from "@workspace/policy";

type Props = {
  busy?: boolean;
  openHref: string;
  onOpen: () => void;
};

/** G1 — one-tap path into My Livia for demo testers (no Clerk). */
export function DemoGuestClientShortcut({ busy, openHref, onOpen }: Props) {
  return (
    <section
      className="mb-8 rounded-2xl border border-rose-400/35 bg-gradient-to-br from-rose-500/15 via-rose-950/20 to-transparent p-5 sm:p-6"
      data-testid="demo-guest-client-shortcut"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-rose-200/80">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            {GUEST_HUB_COPY.productName} · guest
          </p>
          <h2 className="text-lg font-medium text-white sm:text-xl">{DEMO_GUEST_CLIENT_COPY.title}</h2>
          <p className="text-sm text-white/65 max-w-xl leading-relaxed">{DEMO_GUEST_CLIENT_COPY.body}</p>
          <p className="text-xs text-white/45 font-mono">{DEMO_GUEST_CLIENT_COPY.phoneHint}</p>
          <p className="text-xs text-white/50">{DEMO_GUEST_CLIENT_COPY.nameHint}</p>
        </div>
        <a
          href={openHref}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            onOpen();
          }}
          aria-disabled={busy}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-rose-400/90 px-5 py-3 text-sm font-semibold text-rose-950 hover:bg-rose-300 min-h-[48px] w-full sm:w-auto ${busy ? "opacity-60 pointer-events-none" : ""}`}
          data-testid="demo-guest-client-open"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <>
              {DEMO_GUEST_CLIENT_COPY.cta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </a>
      </div>
      <p className="mt-3 text-[10px] text-white/35 font-mono text-right sm:text-left">
        Ctrl+click · open guest view in a new tab alongside staff roles
      </p>
    </section>
  );
}
