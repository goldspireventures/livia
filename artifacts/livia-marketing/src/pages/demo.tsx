import { Link } from "wouter";
import { DemoGateShell } from "@/components/demo/demo-gate-shell";
import { DemoConciergeGrid } from "@/components/demo/demo-concierge-grid";

export default function DemoPage() {
  return (
    <DemoGateShell>
      <div className="cst-demo-concierge">
        <h1 className="cst-demo-concierge__headline">
          <span className="cst-demo-concierge__headline-line">Walk a real business</span>
          <span className="cst-demo-concierge__headline-accent">in 90 seconds</span>
        </h1>

        <DemoConciergeGrid />

        <p className="cst-demo-concierge__footer">
          <Link href="/verticals" className="cst-demo-concierge__all">
            All verticals
          </Link>
        </p>
      </div>
    </DemoGateShell>
  );
}
