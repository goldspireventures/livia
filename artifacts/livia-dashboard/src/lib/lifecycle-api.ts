import { apiFetch } from "@/lib/api-fetch";

export type GraduationSuggestion = {
  id: string;
  title: string;
  summary: string;
  whyNow: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  status: string;
  priority: number;
};

export type PendingRitual = {
  type: "keys_changed";
  businessId: string;
  transferredAt: string;
};

export type OwnershipCandidate = {
  userId: string;
  role: string;
  email: string;
  fullName: string | null;
  deskRole: "manager" | "reception";
};

export type RosterWithoutSignIn = {
  staffId: string;
  displayName: string;
  email: string | null;
};

export type OwnershipCandidatesPayload = {
  candidates: OwnershipCandidate[];
  rosterWithoutSignIn: RosterWithoutSignIn[];
};

export function fetchUserLifecycle() {
  return apiFetch<{
    ownerBusinessCount: number;
    suggestions: GraduationSuggestion[];
    pendingRituals: PendingRitual[];
  }>("/me/lifecycle");
}

export function fetchBusinessLifecycle(businessId: string) {
  return apiFetch<{
    context: Record<string, unknown>;
    suggestions: GraduationSuggestion[];
  }>(`/businesses/${businessId}/lifecycle`);
}

export function fetchOwnershipCandidates(businessId: string) {
  return apiFetch<OwnershipCandidatesPayload>(
    `/businesses/${businessId}/ownership-candidates`,
  ).then((payload) => ({
    candidates: payload?.candidates ?? [],
    rosterWithoutSignIn: payload?.rosterWithoutSignIn ?? [],
  }));
}

export function transferOwnership(
  businessId: string,
  body: { incomingUserId: string; outgoingDisposition: "STAFF" | "ADMIN" | "REVOKE" },
) {
  return apiFetch<{
    businessId: string;
    previousOwnerId: string;
    newOwnerId: string;
    showKeysRitualForUserId: string;
  }>(`/businesses/${businessId}/transfer-ownership`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const KEYS_RITUAL_KEY = "livia.keysRitual.dismissed";

export function dismissKeysRitual(businessId: string) {
  const raw = localStorage.getItem(KEYS_RITUAL_KEY);
  const set = new Set<string>(raw ? JSON.parse(raw) : []);
  set.add(businessId);
  localStorage.setItem(KEYS_RITUAL_KEY, JSON.stringify([...set]));
}

export function isKeysRitualDismissed(businessId: string) {
  const raw = localStorage.getItem(KEYS_RITUAL_KEY);
  if (!raw) return false;
  try {
    return (JSON.parse(raw) as string[]).includes(businessId);
  } catch {
    return false;
  }
}
