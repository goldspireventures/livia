import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FINAL_PLATFORM_SCREENS,
  FINAL_SCREEN_GROUPS,
  allImagesForScreen,
  screensForGroup,
  type FinalScreenGroup,
} from "@/lib/platform-surfaces-concepts";

/**
 * Dev-only — http://localhost:5173/experience/platform-surfaces
 * Final & north-star screen catalog (not A/B/C concept picker).
 */
export default function PlatformSurfacesGalleryPage() {
  const [group, setGroup] = useState<FinalScreenGroup>("marketing");
  const [screenId, setScreenId] = useState("m1-home");
  const [variantId, setVariantId] = useState("main");

  const groupScreens = useMemo(() => screensForGroup(group), [group]);
  const selected = useMemo(
    () => FINAL_PLATFORM_SCREENS.find((s) => s.id === screenId) ?? groupScreens[0] ?? null,
    [screenId, groupScreens],
  );
  const images = useMemo(() => (selected ? allImagesForScreen(selected) : []), [selected]);
  const activeImage = useMemo(
    () => images.find((v) => v.id === variantId) ?? images[0],
    [images, variantId],
  );

  useEffect(() => {
    const first = screensForGroup(group)[0];
    if (first) setScreenId(first.id);
    setVariantId("main");
  }, [group]);

  useEffect(() => {
    setVariantId("main");
  }, [screenId]);

  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-muted-foreground">
        Design gallery is dev-only.
      </div>
    );
  }

  const lockedCount = FINAL_PLATFORM_SCREENS.filter((s) => s.status === "locked").length;
  const northStarCount = FINAL_PLATFORM_SCREENS.filter((s) => s.status === "north-star").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/50 px-6 py-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-500 mb-2">
          Livia — final screen catalog · dev only
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Platform surfaces</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground leading-relaxed">
          Approved locks + north-star targets. {lockedCount} locked · {northStarCount} north-star ·{" "}
          {FINAL_PLATFORM_SCREENS.length} screens total. Deprecated concept PNGs removed.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/demo">Demo launcher (live)</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/experience/brand-logos">Logo concepts</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/experience/livia-evolution">Livia evolution (R1 / v3 / north star)</Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6 p-6">
        <aside className="rounded-xl border border-border bg-card p-4 h-fit lg:sticky lg:top-6 space-y-4">
          {FINAL_SCREEN_GROUPS.map((g) => {
            const items = screensForGroup(g.id);
            if (items.length === 0) return null;
            return (
              <div key={g.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full text-left text-xs font-semibold uppercase tracking-wider mb-2 px-1",
                    group === g.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setGroup(g.id)}
                >
                  {g.label}
                </button>
                {group === g.id ? (
                  <div className="flex flex-col gap-1">
                    {items.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          screenId === s.id
                            ? "bg-primary text-primary-foreground font-medium"
                            : "bg-muted/50 hover:bg-muted",
                        )}
                        onClick={() => setScreenId(s.id)}
                      >
                        <span className="block truncate">{s.name}</span>
                        {s.status === "locked" ? (
                          <span className="text-[9px] uppercase opacity-80">locked</span>
                        ) : s.status === "north-star" ? (
                          <span className="text-[9px] uppercase opacity-80">north-star</span>
                        ) : (
                          <span className="text-[9px] uppercase opacity-80">alternate</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </aside>

        <div className="space-y-4">
          {selected && activeImage ? (
            <>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold">{selected.name}</h2>
                  {selected.status === "locked" ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      Locked
                    </span>
                  ) : selected.status === "north-star" ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                      North-star
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Alternate layout
                    </span>
                  )}
                  <span className="text-muted-foreground text-sm">({selected.docSection})</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{selected.tagline}</p>
              </div>

              {images.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {images.map((v) => (
                    <Button
                      key={v.id}
                      size="sm"
                      variant={variantId === v.id ? "default" : "outline"}
                      onClick={() => setVariantId(v.id)}
                    >
                      {v.label}
                    </Button>
                  ))}
                </div>
              ) : null}

              <div className="rounded-xl border border-border bg-muted/30 p-2">
                <img
                  src={`/platform-surfaces/${activeImage.imageFile}`}
                  alt={`${selected.name} — ${activeImage.label}`}
                  className="w-full h-auto rounded-lg border border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                <code>{activeImage.imageFile}</code>
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No screen selected.</p>
          )}
        </div>
      </div>
    </div>
  );
}
