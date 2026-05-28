import { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Business } from "@workspace/api-client-react";

const STORAGE_KEY = "livia.currentBusinessId";
const LEGACY_KEYS = ["livia_current_business_id", "bliq_current_business_id"];

interface BusinessContextType {
  business: Business | null;
  businesses: Business[];
  setBusiness: (business: Business | null) => void;
  setBusinessById: (id: string) => void;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

/** Coerce API / cache payloads into a Business[] (handles wrapped demo-seed shapes). */
export function normalizeBusinessList(input: unknown): Business[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (Array.isArray(record.businesses)) return record.businesses as Business[];
    if (Array.isArray(record.data)) return record.data as Business[];
    if (typeof record.id === "string") return [input as Business];
  }
  return [];
}

/**
 * Resolve the active business from a list of memberships.
 * Order: persisted-id-if-still-member > first OWNER membership > businesses[0].
 * Per ADR 0010 (multi-tenant + persona model) — the Tenant axis is first-class
 * and persisted client-side; we don't put the businessId in the URL.
 */
function readPersistedBusinessId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) return current;
    for (const key of LEGACY_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy) {
        window.localStorage.setItem(STORAGE_KEY, legacy);
        window.localStorage.removeItem(key);
        return legacy;
      }
    }
    for (const key of LEGACY_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    return null;
  }
  return null;
}

function resolveInitialBusiness(businesses: Business[]): Business | null {
  if (businesses.length === 0) return null;
  const persisted = readPersistedBusinessId();
  if (persisted) {
    const found = businesses.find((b) => b.id === persisted);
    if (found) return found;
  }
  // Prefer the first business where the user is OWNER, if role info ever lands
  // on the Business object. For now, just return the first.
  return businesses[0];
}

export function BusinessProvider({
  children,
  businesses: businessesInput = [],
  isLoading,
}: {
  children: ReactNode;
  businesses?: Business[] | unknown;
  isLoading?: boolean;
}) {
  const qc = useQueryClient();
  const businesses = useMemo(
    () => normalizeBusinessList(businessesInput),
    [businessesInput],
  );
  const [business, setBusinessState] = useState<Business | null>(() =>
    resolveInitialBusiness(businesses)
  );

  // Re-resolve whenever the membership list changes (e.g. after invite accept).
  useEffect(() => {
    setBusinessState((prev) => {
      if (prev && businesses.find((b) => b.id === prev.id)) return prev;
      return resolveInitialBusiness(businesses);
    });
  }, [businesses]);

  const persist = useCallback((b: Business | null) => {
    try {
      if (b) window.localStorage.setItem(STORAGE_KEY, b.id);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const setBusiness = useCallback(
    (b: Business | null) => {
      setBusinessState(b);
      persist(b);
      // Reset persona when switching tenants — viewing-as-staff doesn't carry across.
      try {
        window.localStorage.removeItem("livia.viewingAsStaffId");
      } catch {
        // ignore
      }
      // Invalidate all per-business queries so the UI repaints with the new tenant.
      qc.invalidateQueries();
    },
    [persist, qc]
  );

  const setBusinessById = useCallback(
    (id: string) => {
      const target = businesses.find((b) => b.id === id);
      if (target) setBusiness(target);
    },
    [businesses, setBusiness]
  );

  const value = useMemo(
    () => ({
      business,
      businesses,
      setBusiness,
      setBusinessById,
      isLoading: isLoading || false,
    }),
    [business, businesses, setBusiness, setBusinessById, isLoading]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}
