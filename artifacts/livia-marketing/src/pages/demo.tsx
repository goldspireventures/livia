import { Link } from "wouter";
import { DemoGateShell } from "@/components/demo/demo-gate-shell";
import { DemoGateGuard } from "@/components/demo/demo-gate-guard";
import { DemoConciergeGrid } from "@/components/demo/demo-concierge-grid";
import { marketingBookDemoPath } from "@/lib/marketing-links";

export default function DemoPage() {
  return (
    <DemoGateGuard>
      <DemoGateShell>
        <div className="cst-demo-concierge">
          <p className="cst-demo-concierge__eyebrow text-center text-[10px] font-mono uppercase tracking-widest text-[#d9c39a]/70 mb-3">
            Invited guests
          </p>
          <h1 className="cst-demo-concierge__headline">
            <span className="cst-demo-concierge__headline-line">Walk a real business</span>
            <span className="cst-demo-concierge__headline-accent">in 90 seconds</span>
          </h1>

          <DemoConciergeGrid />

          <p className="cst-demo-concierge__footer">
            <Link href={marketingBookDemoPath} className="cst-demo-concierge__all">
              Request demo access
            </Link>
            <span className="mx-2 text-muted-foreground/50" aria-hidden>
              ·
            </span>
            <Link href="/verticals" className="cst-demo-concierge__all">
              All verticals
            </Link>
          </p>
        </div>
      </DemoGateShell>
    </DemoGateGuard>
  );
}
