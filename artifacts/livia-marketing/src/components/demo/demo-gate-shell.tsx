import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { applyMarketingPlatformTheme } from "@/lib/marketing-platform-theme";
import "@/styles/constellation-w1-gold.css";
import "@/styles/constellation-demo-gate-stars.css";
import "@/styles/constellation-demo-concierge.css";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

function NebulaCorner({ corner }: { corner: "tr" | "bl" }) {
  return (
    <div className={`cst-demo-gate__nebula cst-demo-gate__nebula--${corner}`}>
      <div className="cst-demo-gate__wisp cst-demo-gate__wisp--1" />
      <div className="cst-demo-gate__wisp cst-demo-gate__wisp--2" />
      <div className="cst-demo-gate__wisp cst-demo-gate__wisp--3" />
      <div className="cst-demo-gate__wisp cst-demo-gate__wisp--4" />
    </div>
  );
}

/** Minimal chrome for /demo — logo + LIVE only, no nav/footer (concierge gate). */
export function DemoGateShell({ children }: { children: ReactNode }) {
  const homeHref = base || "/";

  useEffect(() => {
    applyMarketingPlatformTheme();
  }, []);

  return (
    <div className="cst-demo-gate">
      <div className="cst-demo-gate__ambient" aria-hidden>
        <div className="cst-demo-gate__texture" />
        <NebulaCorner corner="tr" />
        <NebulaCorner corner="bl" />
        <div className="cst-demo-gate__stars" />
        <div className="cst-demo-gate__noise" />
      </div>

      <header className="cst-demo-gate__bar cst-demo-gate__bar--minimal">
        <Link href={homeHref} className="cst-demo-gate__logo">
          <LiviaWordmark size="md" />
        </Link>
      </header>

      <main className="cst-demo-gate__main">{children}</main>
    </div>
  );
}
