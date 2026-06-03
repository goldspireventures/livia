import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { marketingBookDemoPath } from "@/lib/marketing-links";
import {
  clearDemoGateKey,
  persistDemoGateKey,
  readDemoGateKeyFromLocation,
  verifyDemoGateKey,
} from "@/lib/marketing-demo-gate-client";

type DemoGateGuardProps = {
  children: ReactNode;
};

/** Blocks W1 /demo until API validates a gate key (from book-demo or invite email). */
export function DemoGateGuard({ children }: DemoGateGuardProps) {
  const [, setLocation] = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const key = readDemoGateKeyFromLocation();
      if (!key) {
        if (!cancelled) setAllowed(false);
        return;
      }

      const valid = await verifyDemoGateKey(key);
      if (cancelled) return;

      if (valid) {
        persistDemoGateKey(key);
        setAllowed(true);
      } else {
        clearDemoGateKey();
        setAllowed(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (allowed === false) {
      setLocation(marketingBookDemoPath);
    }
  }, [allowed, setLocation]);

  if (allowed === null) {
    return (
      <div className="cst-demo-gate__loading" role="status" aria-live="polite">
        Checking demo access…
      </div>
    );
  }

  if (!allowed) return null;

  return children;
}
