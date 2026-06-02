import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import {
  clearGatewaySkinHandoff,
  gatewayHandoffEnterMs,
  gatewayHandoffExitMs,
  gatewayHandoffPrefersReducedMotion,
  markGatewaySkinHandoff,
  peekGatewaySkinHandoff,
} from "@/lib/gateway-skin-handoff";
import { applyGatewaySurfaceTheme } from "@/lib/gateway-surface-theme";
import { applyTenantShellFromCache } from "@/lib/prefetch-tenant-dashboard";
import { cn } from "@/lib/utils";

type VeilPhase = "hidden" | "exit" | "enter";

type HandoffOpts = {
  vertical?: string;
  businessId?: string;
  /** Client route change — veil stays mounted; prefetch cache survives. */
  soft?: boolean;
};

type GatewaySkinHandoffContextValue = {
  transitionToTenant: (go: () => void, opts?: HandoffOpts) => Promise<void>;
};

const GatewaySkinHandoffContext = createContext<GatewaySkinHandoffContextValue | null>(null);

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function runVeilAnimation(phase: "exit" | "enter"): Promise<void> {
  const ms = phase === "exit" ? gatewayHandoffExitMs() : gatewayHandoffEnterMs();
  return waitMs(ms);
}

export function GatewaySkinHandoffProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [phase, setPhase] = useState<VeilPhase>("hidden");
  const [vertical, setVertical] = useState<string | undefined>();
  const [runAnim, setRunAnim] = useState(false);
  const coldEnterStarted = useRef(false);

  const primeTenantUnderVeil = useCallback(
    (businessId?: string) => {
      if (businessId) {
        applyTenantShellFromCache(queryClient, businessId);
      }
    },
    [queryClient],
  );

  const playEnter = useCallback(
    async (payload?: { vertical?: string; businessId?: string }) => {
      setVertical(payload?.vertical);
      primeTenantUnderVeil(payload?.businessId);
      setPhase("enter");
      setRunAnim(false);
      if (!gatewayHandoffPrefersReducedMotion()) {
        document.documentElement.setAttribute("data-gateway-handoff-reveal", "");
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setRunAnim(true);
            resolve();
          });
        });
      });
      await runVeilAnimation("enter");
      clearGatewaySkinHandoff();
      setPhase("hidden");
      setRunAnim(false);
      document.documentElement.removeAttribute("data-gateway-handoff-reveal");
    },
    [primeTenantUnderVeil],
  );

  useEffect(() => {
    if (coldEnterStarted.current) return;
    const payload = peekGatewaySkinHandoff();
    if (!payload) return;
    coldEnterStarted.current = true;
    void playEnter({ vertical: payload.vertical, businessId: payload.businessId });
  }, [playEnter]);

  useEffect(() => {
    if (userId) return;
    coldEnterStarted.current = false;
    clearGatewaySkinHandoff();
    setPhase("hidden");
    setRunAnim(false);
    document.documentElement.removeAttribute("data-gateway-handoff-reveal");
    applyGatewaySurfaceTheme();
  }, [userId]);

  const transitionToTenant = useCallback(
    async (go: () => void, opts?: HandoffOpts) => {
      markGatewaySkinHandoff({
        vertical: opts?.vertical,
        businessId: opts?.businessId,
      });
      setVertical(opts?.vertical);
      setPhase("exit");
      setRunAnim(false);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setRunAnim(true);
            resolve();
          });
        });
      });
      await runVeilAnimation("exit");

      if (opts?.soft) {
        go();
        await playEnter({ vertical: opts?.vertical, businessId: opts?.businessId });
        return;
      }

      go();
    },
    [playEnter],
  );

  const value = useMemo(() => ({ transitionToTenant }), [transitionToTenant]);

  return (
    <GatewaySkinHandoffContext.Provider value={value}>
      {children}
      {phase !== "hidden" ? (
        <div
          className={cn(
            "gateway-handoff-veil gateway-handoff-veil--visible",
            phase === "exit" ? "gateway-handoff-veil--exit" : "gateway-handoff-veil--enter",
            runAnim && "gateway-handoff-veil--run",
          )}
          data-testid={phase === "exit" ? "gateway-handoff-exit" : "gateway-handoff-enter"}
          data-vertical={vertical}
          aria-hidden
        />
      ) : null}
    </GatewaySkinHandoffContext.Provider>
  );
}

export function useGatewaySkinHandoff(): GatewaySkinHandoffContextValue {
  const ctx = useContext(GatewaySkinHandoffContext);
  if (!ctx) {
    throw new Error("useGatewaySkinHandoff must be used within GatewaySkinHandoffProvider");
  }
  return ctx;
}

/** Safe when provider may be absent (tests). */
export function useGatewaySkinHandoffOptional(): GatewaySkinHandoffContextValue | null {
  return useContext(GatewaySkinHandoffContext);
}
