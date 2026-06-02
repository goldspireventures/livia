import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import "@/styles/constellation-surface.css";

type ConstellationPageShellProps = {
  children: ReactNode;
  /** Stronger orbit watermark — verticals index, etc. */
  tone?: "default" | "strong";
};

function OrbitWatermark() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden className="cst-page__orbit-svg">
      <circle cx="100" cy="100" r="78" fill="none" stroke="#d9c39a" strokeWidth="1.1" opacity="0.85" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="#d9c39a" strokeWidth="0.85" opacity="0.65" />
      <circle cx="100" cy="100" r="28" fill="none" stroke="#d9c39a" strokeWidth="0.55" opacity="0.45" />
      <ellipse cx="100" cy="100" rx="78" ry="28" fill="none" stroke="#d9c39a" strokeWidth="0.75" opacity="0.55" />
      <ellipse cx="100" cy="100" rx="28" ry="78" fill="none" stroke="#d9c39a" strokeWidth="0.55" opacity="0.35" />
    </svg>
  );
}

/** Ambient Constellation layer for inner W1 pages — not the full home diagram. */
export function ConstellationPageShell({ children, tone = "default" }: ConstellationPageShellProps) {
  return (
    <div className={cn("cst-page", tone === "strong" && "cst-page--strong")}>
      <div className="cst-page__ambient" aria-hidden>
        <div className="cst-page__stars" />
        <div className="cst-page__nebula" />
        <div className="cst-page__orbit cst-page__orbit--primary">
          <OrbitWatermark />
        </div>
        {tone === "strong" ? (
          <div className="cst-page__orbit cst-page__orbit--secondary">
            <OrbitWatermark />
          </div>
        ) : null}
      </div>
      <div className="cst-page__content">{children}</div>
    </div>
  );
}
