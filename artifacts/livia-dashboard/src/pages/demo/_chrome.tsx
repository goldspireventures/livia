import { Link } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  PERSONAS,
  ACCENT_CLASSES,
  nextPersona,
  prevPersona,
  type Persona,
} from "@/lib/demo/personas";

/**
 * Persistent ambient halo that reflects the active persona's accent.
 * Sits behind every showcase so the room "feels" different the moment
 * you cross the threshold (the hotel principle in colour terms).
 */
export function AmbientHalo({ persona }: { persona: Persona }) {
  const a = ACCENT_CLASSES[persona.accent];
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden>
      <div className={`absolute -top-40 -left-40 h-[60vh] w-[60vh] rounded-full blur-[140px] ${a.bg}`} />
      <div className={`absolute -bottom-40 -right-40 h-[50vh] w-[50vh] rounded-full blur-[140px] ${a.bg}`} />
      <div className="absolute inset-0 bg-[#09090b]/30" />
    </div>
  );
}

/** Top-left "back to the lobby" pill on every persona surface. */
export function BackToGateway({ accent }: { accent: Persona["accent"] }) {
  const a = ACCENT_CLASSES[accent];
  return (
    <Link href="/demo">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border ${a.border} bg-background/60 backdrop-blur-md px-3 py-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground hover-elevate cursor-pointer`}
        data-testid="demo-back-to-gateway"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to gateway
      </div>
    </Link>
  );
}

/**
 * Bottom-right floating chip that lets the visitor hop personas in one tap.
 * Shows the current persona's name + role, opens a dropdown of the other six.
 */
export function PersonaChip({ persona }: { persona: Persona }) {
  const [open, setOpen] = useState(false);
  const a = ACCENT_CLASSES[persona.accent];
  const next = nextPersona(persona.id);
  const prev = prevPersona(persona.id);
  return (
    <div className="fixed bottom-4 right-4 z-50" data-testid="demo-persona-chip">
      {open ? (
        <div className="mb-2 w-72 rounded-xl border border-border bg-background/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-mono">
              Step into another room
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              close
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {PERSONAS.filter((p) => p.id !== persona.id).map((p) => {
              const pa = ACCENT_CLASSES[p.accent];
              return (
                <Link key={p.id} href={`/demo/${p.id}`}>
                  <div
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover-elevate"
                    data-testid={`demo-persona-chip-option-${p.id}`}
                    onClick={() => setOpen(false)}
                  >
                    <div className={`h-7 w-7 rounded-full border ${pa.border} ${pa.bg} flex items-center justify-center`}>
                      <Sparkles className={`h-3 w-3 ${pa.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{p.displayName}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{p.roleLabel}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-1">
        <Link href={`/demo/${prev.id}`}>
          <button
            className={`h-9 w-9 rounded-full border border-border bg-background/80 backdrop-blur-md flex items-center justify-center hover-elevate`}
            aria-label={`Previous persona — ${prev.displayName}`}
            data-testid="demo-persona-prev"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`h-11 inline-flex items-center gap-2 rounded-full border ${a.border} ${a.bg} backdrop-blur-md pl-3 pr-4 text-xs font-medium hover-elevate`}
          data-testid="demo-persona-chip-trigger"
        >
          <span className={`h-2 w-2 rounded-full ${a.bg.replace("/15", "")}`} />
          <span className={a.text}>{persona.displayName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">Switch persona</span>
        </button>
        <Link href={`/demo/${next.id}`}>
          <button
            className={`h-9 w-9 rounded-full border border-border bg-background/80 backdrop-blur-md flex items-center justify-center hover-elevate`}
            aria-label={`Next persona — ${next.displayName}`}
            data-testid="demo-persona-next"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </Link>
      </div>
    </div>
  );
}

/** The frame every persona showcase wears. */
export function ShowcaseFrame({
  persona,
  children,
}: {
  persona: Persona;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-white relative">
      <AmbientHalo persona={persona} />
      <div className="absolute top-4 left-4 z-40">
        <BackToGateway accent={persona.accent} />
      </div>
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-32">{children}</div>
      <PersonaChip persona={persona} />
    </div>
  );
}
