import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LOGO_CONCEPTS, type LogoConcept } from "@/lib/brand-logo-concepts";
import {
  ICON_VARIANTS_BY_FAMILY,
  defaultIconVariant,
  isIconFamily,
} from "@/lib/brand-logo-icon-variants";
import {
  LogoConceptMarkOnly,
  LogoConceptPreview,
} from "@/components/brand/logo-concepts/LogoConceptMarks";

function NavMock({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg border border-white/10 px-5 py-3 flex items-center justify-between"
      style={{
        background:
          "linear-gradient(180deg, rgba(14,14,22,0.95) 0%, rgba(8,8,14,0.98) 100%)",
      }}
    >
      {children}
      <div className="hidden sm:flex gap-6 text-xs text-white/50">
        <span>Pricing</span>
        <span>How it works</span>
        <span className="text-cyan-400/80">Start free</span>
      </div>
    </div>
  );
}

function AppIconMock({
  conceptId,
  iconVariantId,
}: {
  conceptId: LogoConcept["id"];
  iconVariantId?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-[88px] h-[88px] rounded-[22px] flex items-center justify-center border border-[#d9c39a]/25"
          style={{ background: "linear-gradient(180deg, #0e0e16, #06060c)" }}
        >
          <LogoConceptMarkOnly
            conceptId={conceptId}
            className="h-12 w-12"
            variant="icon"
            iconVariantId={iconVariantId}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">88px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-[180px] h-[180px] rounded-[40px] flex items-center justify-center border border-[#d9c39a]/25"
          style={{ background: "linear-gradient(180deg, #0e0e16, #06060c)" }}
        >
          <LogoConceptMarkOnly
            conceptId={conceptId}
            className="h-24 w-24"
            variant="icon"
            iconVariantId={iconVariantId}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">180px store</span>
      </div>
    </div>
  );
}

function FaviconMock({
  conceptId,
  iconVariantId,
}: {
  conceptId: LogoConcept["id"];
  iconVariantId?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center border border-border"
        style={{ background: "#0e0e16" }}
      >
        <LogoConceptMarkOnly
          conceptId={conceptId}
          className="h-5 w-5"
          variant="icon"
          iconVariantId={iconVariantId}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">32px</span>
    </div>
  );
}

/**
 * Dev-only — http://localhost:5173/experience/brand-logos
 */
export default function BrandLogoGalleryPage() {
  const [conceptId, setConceptId] = useState(LOGO_CONCEPTS[0]!.id);
  const [iconVariantId, setIconVariantId] = useState<string | undefined>(undefined);

  const selected = useMemo(
    () => LOGO_CONCEPTS.find((c) => c.id === conceptId) ?? LOGO_CONCEPTS[0]!,
    [conceptId],
  );

  const iconVariants = isIconFamily(conceptId) ? ICON_VARIANTS_BY_FAMILY[conceptId] : [];

  useEffect(() => {
    if (isIconFamily(conceptId)) {
      setIconVariantId(defaultIconVariant(conceptId));
    } else {
      setIconVariantId(undefined);
    }
  }, [conceptId]);

  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-muted-foreground">
        Brand logo gallery is dev-only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/50 px-6 py-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-500 mb-2">
          Livia Inc brand · dev only
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Logo concepts</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground leading-relaxed">
          Nav + wordmark lockups are fixed for Thread L & Open Arc. Pick an <strong>app icon</strong>{" "}
          variant below (3 options each). Live vectors + PNG sheets.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/experience/platform-surfaces">Platform surfaces</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/experience/livia-evolution">Livia evolution</Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 p-6">
        <aside className="rounded-xl border border-border bg-card p-4 h-fit lg:sticky lg:top-6 space-y-1">
          {LOGO_CONCEPTS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn(
                "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                conceptId === c.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted/50 hover:bg-muted",
              )}
              onClick={() => setConceptId(c.id)}
            >
              <span className="block">
                {c.name.replace(/^Concept \d — /, "").replace(/^Current — /, "")}
              </span>
              <span className="text-[9px] uppercase opacity-75">
                {c.status === "shipped" ? "shipped" : "concept"}
              </span>
            </button>
          ))}
        </aside>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">{selected.name}</h2>
              {selected.status === "shipped" ? (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Shipped
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                  Concept
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{selected.tagline}</p>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <p className="text-xs text-muted-foreground px-4 py-2 border-b border-border bg-muted/30">
              M0 marketing nav — wordmark lockup (unchanged)
            </p>
            <div
              className="p-8"
              style={{
                background:
                  "radial-gradient(900px 500px at 50% 0%, #14131c 0%, #08080d 60%, #04040a 100%)",
              }}
            >
              <NavMock>
                <LogoConceptPreview conceptId={conceptId} size="md" />
              </NavMock>
            </div>
          </div>

          {iconVariants.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                App icon variants — pick one
              </p>
              <div className="flex flex-wrap gap-2">
                {iconVariants.map((v) => (
                  <Button
                    key={v.id}
                    size="sm"
                    variant={iconVariantId === v.id ? "default" : "outline"}
                    onClick={() => setIconVariantId(v.id)}
                  >
                    {v.name}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {iconVariants.find((v) => v.id === iconVariantId)?.tagline}
              </p>
            </div>
          ) : null}

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground self-start">App icon</p>
              <AppIconMock conceptId={conceptId} iconVariantId={iconVariantId} />
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground self-start">Favicon</p>
              <FaviconMock conceptId={conceptId} iconVariantId={iconVariantId} />
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center gap-3 min-h-[120px] sm:col-span-3">
              <p className="text-xs text-muted-foreground self-start">Light surface</p>
              <div className="bg-[#f6f3ec] rounded-lg px-4 py-3">
                <span className="text-[#0e0e16]">
                  <LogoConceptPreview conceptId={conceptId} size="sm" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
