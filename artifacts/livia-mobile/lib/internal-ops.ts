import * as SecureStore from "expo-secure-store";
import { getApiBaseUrl } from "@/lib/api-base";

const OPS_SECRET_KEY = "livia.internal.opsSecret";
const OPS_OPERATOR_KEY = "livia.internal.opsOperator";

export type FounderCockpitSnapshot = {
  platformHealth: {
    version: string;
    nodeEnv: string;
    tenantCount: number;
    inngestEnabled: boolean;
    stripeConfigured: boolean;
    clerkConfigured: boolean;
    timestamp: string;
  };
  observability: {
    timestamp: string;
    collectedInMs: number;
    database: { ok: boolean; latencyMs: number };
    traffic: {
      bookingsToday: number;
      bookingsPending: number;
      conversationsOpen: number;
      messagesLast24h: number;
      messagesFailed24h: number;
    };
    support: { ticketsOpen: number };
    alerts: Array<{ level: "warn" | "critical"; message: string }>;
  };
  support?: {
    openTotal: number;
    urgentOpen: number;
    oldestOpenHours: number | null;
    urgent: Array<{
      id: string;
      businessName: string;
      businessSlug: string;
      category: string;
      priority: "urgent" | "normal" | "low";
      createdAt: string;
      assignedTo: string | null;
    }>;
  };
  rollouts?: {
    globalEnabled: Array<{ key: string; description: string | null }>;
    totalFlags: number;
  };
  gate: { founderGate: unknown | null; wargameReport: unknown | null };
  verticalCoverage: unknown;
};

export async function getFounderOpsSecret(): Promise<string | null> {
  return (await SecureStore.getItemAsync(OPS_SECRET_KEY)) ?? null;
}

export async function setFounderOpsSecret(secret: string): Promise<void> {
  await SecureStore.setItemAsync(OPS_SECRET_KEY, secret.trim());
}

export async function clearFounderOpsSecret(): Promise<void> {
  await SecureStore.deleteItemAsync(OPS_SECRET_KEY);
}

export async function getFounderOperatorEmail(): Promise<string | null> {
  return (await SecureStore.getItemAsync(OPS_OPERATOR_KEY)) ?? null;
}

export async function setFounderOperatorEmail(email: string): Promise<void> {
  await SecureStore.setItemAsync(OPS_OPERATOR_KEY, email.trim().toLowerCase());
}

export async function fetchFounderCockpit(): Promise<FounderCockpitSnapshot> {
  const secret = await getFounderOpsSecret();
  if (!secret) throw new Error("Set INTERNAL_OPS_SECRET on this device first.");
  const operator = (await getFounderOperatorEmail()) ?? "founder@livia.io";

  const res = await fetch(`${getApiBaseUrl()}/api/internal/ops/org-admin/cockpit`, {
    headers: {
      Accept: "application/json",
      "X-Internal-Ops-Secret": secret,
      "X-Internal-Ops-Operator": operator,
      "X-Internal-Ops-Role": "exec",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { error?: string };
      throw new Error(j.error || `Request failed (${res.status})`);
    } catch {
      throw new Error(text || `Request failed (${res.status})`);
    }
  }
  return JSON.parse(text) as FounderCockpitSnapshot;
}

