import { useEffect } from "react";
import { Link } from "wouter";
import { DemoGateShell } from "@/components/demo/demo-gate-shell";
import { DemoGateGuard } from "@/components/demo/demo-gate-guard";
import { DemoConciergeGrid } from "@/components/demo/demo-concierge-grid";
import { marketingBookDemoPath } from "@/lib/marketing-links";
import { readDemoGateKeyFromLocation } from "@/lib/marketing-demo-gate-client";
import { marketingDemoHandoffUrl, normalizeMarketingVerticalSlug } from "@/lib/marketing-demo-handoff";

/** Skip concierge grid when book-demo already named a trade. */
function DemoVerticalAutoHandoff() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vertical = normalizeMarketingVerticalSlug(params.get("vertical"));
    const key = readDemoGateKeyFromLocation();
    if (!vertical || !key) return;
    const target = marketingDemoHandoffUrl({ vertical, gateKey: key });
    if (target.includes("/wedge/")) {
      window.location.replace(target);
    }
  }, []);
  return null;
}

export default function DemoPage() {
  return (
    <DemoGateGuard>
      <DemoVerticalAutoHandoff />
      <DemoGateShell>
        <div className="cst-demo-concierge">
          <p className="cst-demo-concierge__eyebrow text-center text-[10px] font-mono uppercase tracking-widest text-[#d9c39a]/70 mb-3">
            Your demo room
          </p>
          <h1 className="cst-demo-concierge__headline">
            <span className="cst-demo-concierge__headline-line">Walk a real business</span>
            <span className="cst-demo-concierge__headline-accent">in 90 seconds</span>
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-center text-sm leading-relaxed text-white/55">
            Pick the trade closest to yours. Each card opens a seeded studio — guest book, owner sign-in,
            and the same flows you get after onboarding.
          </p>

          <DemoConciergeGrid />

          <p className="cst-demo-concierge__footer">
            <Link href="/verticals" className="cst-demo-concierge__all">
              Trade stories on the site
            </Link>
            <span className="mx-2 text-muted-foreground/50" aria-hidden>
              ·
            </span>
            <Link href={marketingBookDemoPath} className="cst-demo-concierge__all">
              Share access with a colleague
            </Link>
          </p>
        </div>
      </DemoGateShell>
    </DemoGateGuard>
  );
}
