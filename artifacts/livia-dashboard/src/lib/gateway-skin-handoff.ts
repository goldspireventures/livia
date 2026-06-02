/** Session flag: W2 gateway → W4 tenant skin dissolve (see gateway-handoff.css). */
export const GATEWAY_SKIN_HANDOFF_KEY = "livia.gateway.skinHandoff";

export type GatewaySkinHandoffPayload = {
  vertical?: string;
  at: number;
};

export function markGatewaySkinHandoff(vertical?: string): void {
  const payload: GatewaySkinHandoffPayload = {
    vertical,
    at: Date.now(),
  };
  try {
    sessionStorage.setItem(GATEWAY_SKIN_HANDOFF_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function peekGatewaySkinHandoff(): GatewaySkinHandoffPayload | null {
  try {
    const raw = sessionStorage.getItem(GATEWAY_SKIN_HANDOFF_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as GatewaySkinHandoffPayload;
    if (!payload?.at || Date.now() - payload.at > 45_000) {
      clearGatewaySkinHandoff();
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function clearGatewaySkinHandoff(): void {
  try {
    sessionStorage.removeItem(GATEWAY_SKIN_HANDOFF_KEY);
  } catch {
    // ignore
  }
}

export function gatewayHandoffPrefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function gatewayHandoffExitMs(): number {
  return gatewayHandoffPrefersReducedMotion() ? 140 : 760;
}

export function gatewayHandoffEnterMs(): number {
  return gatewayHandoffPrefersReducedMotion() ? 160 : 880;
}
