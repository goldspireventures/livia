import { useEffect, type ReactNode } from "react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { applyGatewaySurfaceTheme } from "@/lib/gateway-surface-theme";
import { cn } from "@/lib/utils";
import "@/styles/gateway-demo-flow.css";
import "@/styles/gateway-demo-flow-stars.css";

type Props = {
  children: ReactNode;
  className?: string;
};

function NebulaCorner({ corner }: { corner: "tr" | "bl" }) {
  return (
    <div className={`w2-demo-flow__nebula w2-demo-flow__nebula--${corner}`}>
      <div className="w2-demo-flow__wisp w2-demo-flow__wisp--1" />
      <div className="w2-demo-flow__wisp w2-demo-flow__wisp--2" />
      <div className="w2-demo-flow__wisp w2-demo-flow__wisp--3" />
      <div className="w2-demo-flow__wisp w2-demo-flow__wisp--4" />
    </div>
  );
}

/**
 * W2 demo flow shell — inherits W1 /demo concierge gate (G2 wedge + G3 enter).
 * Aurora GatewayShell remains for G1 launcher and sign-in family.
 */
export function DemoFlowShell({ children, className }: Props) {
  useEffect(() => {
    applyGatewaySurfaceTheme();
  }, []);

  return (
    <div className={cn("w2-demo-flow", className)}>
      <div className="w2-demo-flow__ambient" aria-hidden>
        <div className="w2-demo-flow__texture" />
        <NebulaCorner corner="tr" />
        <NebulaCorner corner="bl" />
        <div className="w2-demo-flow__stars" />
        <div className="w2-demo-flow__noise" />
      </div>

      <header className="w2-demo-flow__bar w2-demo-flow__bar--minimal">
        <LiviaWordmark size="md" />
      </header>

      <main className="w2-demo-flow__main">{children}</main>
    </div>
  );
}
