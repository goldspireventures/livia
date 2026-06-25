import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  FileText,
  Loader2,
  Store,
  Users,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import type { DemoPartnerTrack } from "@/lib/demo-portal";

const SHAPE_ICONS = {
  "solo-shop": Store,
  "studio-team": Users,
  "multi-site-chain": Building2,
  "quote-first": FileText,
} as const;

type Props = {
  tracks: DemoPartnerTrack[];
  provisioned: boolean;
  devPassword?: string;
  busy: string | null;
  onEnter: (email: string, busyKey: string) => void;
};

export function DemoPartnerTracks({ tracks, provisioned, devPassword, busy, onEnter }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (tracks.length === 0) return null;

  return (
    <section className="mb-10" data-testid="demo-partner-tracks">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#22d3ee]/90">
          Start here
        </p>
        <h2
          className="text-xl text-white mt-1 tracking-tight"
          style={{ fontFamily: "var(--app-font-serif)" }}
        >
          Pick your Tuesday morning
        </h2>
        <p className="text-sm text-white/55 mt-1 max-w-2xl">
          Four curated stories for design partners — one owner, one business, one wow moment. No
          tenant soup.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {tracks.map((track) => {
          const Icon = SHAPE_ICONS[track.id as keyof typeof SHAPE_ICONS] ?? Store;
          const loading = busy === `track:${track.id}`;
          const expanded = expandedId === track.id;
          const guestUrl =
            typeof window !== "undefined" ? `${window.location.origin}${track.guestPath}` : track.guestPath;

          return (
            <article
              key={track.id}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 flex flex-col"
              data-testid={`demo-partner-track-${track.id}`}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#06b6d4]/30 bg-[#06b6d4]/10">
                  <Icon className="h-5 w-5 text-[#22d3ee]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                    {track.orgShapeLabel}
                  </p>
                  <h3 className="text-base font-medium text-white">{track.title}</h3>
                  <p className="text-xs text-white/50 mt-0.5">{track.subtitle}</p>
                </div>
              </div>

              <p className="text-sm text-white/70 mt-3 leading-relaxed">{track.tagline}</p>
              <p className="text-xs text-[#22d3ee]/90 mt-2 font-medium">{track.wowMoment}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!provisioned || !!busy}
                  onClick={() => onEnter(track.enterEmail, `track:${track.id}`)}
                  aria-label={
                    loading ? `Signing in to ${track.title}` : `Enter as owner — ${track.title}`
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#06b6d4] text-black px-4 py-2 text-sm font-semibold hover:bg-[#22d3ee] disabled:opacity-50"
                  data-testid={`demo-partner-enter-${track.id}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      <span className="sr-only">Signing in</span>
                    </>
                  ) : (
                    <>
                      Enter as owner
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>
                {track.wedgeHref ? (
                  <Link
                    href={track.wedgeHref}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                  >
                    Wedge story
                  </Link>
                ) : null}
                <a
                  href={guestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                >
                  Guest view
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {!provisioned ? (
                <p className="text-[11px] text-amber-300/90 mt-2">Set up demo world above first.</p>
              ) : devPassword ? (
                <p className="text-[10px] font-mono text-white/35 mt-2 truncate" title={track.enterEmail}>
                  {track.enterEmail} · {devPassword}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : track.id)}
                className="mt-3 inline-flex items-center gap-1 text-[11px] text-white/45 hover:text-white/70"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
                10-min walkthrough
              </button>

              {expanded ? (
                <ol className="mt-2 space-y-1.5 text-xs text-white/55 list-decimal list-inside">
                  {track.walkthroughSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
