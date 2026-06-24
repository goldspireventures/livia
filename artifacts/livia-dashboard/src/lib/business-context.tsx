import { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Business } from "@workspace/api-client-react";
import {
  prefetchTenantDashboardShell,
  applyTenantShellFromCache,
} from "@/lib/prefetch-tenant-dashboard";
import { warmTenantPresentationSkin } from "@/lib/tenant-presentation-sync";

import { pickPrimarySessionBusiness, type SessionBusinessLike } from "@workspace/policy";
import { readPersistedBusinessId } from "@/lib/tenant-session-storage";

const STORAGE_KEY = "livia.currentBusinessId";

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

function resolveInitialBusiness(
  businesses: Business[],
  clerkUserId?: string,
  sessionEmail?: string | null,
  preferredId?: string | null,
): Business | null {
  if (businesses.length === 0) return null;
  if (clerkUserId) {
    const picked = pickPrimarySessionBusiness(
      businesses as SessionBusinessLike[],
      clerkUserId,
      sessionEmail,
      preferredId ?? readPersistedBusinessId(),
    );
    if (picked) return picked as Business;
  }
  const persisted = preferredId ?? readPersistedBusinessId();
  if (persisted) {
    const found = businesses.find((b) => b.id === persisted);
    if (found) return found;
  }
  return businesses[0] ?? null;
}

export function BusinessProvider({
  children,
  businesses: businessesInput = [],
  isLoading,
  clerkUserId,
  sessionEmail,
  initialBusinessId,
}: {
  children: ReactNode;
  businesses?: Business[] | unknown;
  isLoading?: boolean;
  clerkUserId?: string;
  sessionEmail?: string | null;
  initialBusinessId?: string | null;
}) {
  const qc = useQueryClient();
  const businesses = useMemo(
    () => normalizeBusinessList(businessesInput),
    [businessesInput],
  );
  const [business, setBusinessState] = useState<Business | null>(() =>
    resolveInitialBusiness(businesses, clerkUserId, sessionEmail, initialBusinessId),
  );

  // Re-resolve whenever the membership list changes (e.g. after invite accept).
  useEffect(() => {
    setBusinessState((prev) => {
      if (prev && businesses.find((b) => b.id === prev.id)) return prev;
      return resolveInitialBusiness(businesses, clerkUserId, sessionEmail, initialBusinessId);
    });
  }, [businesses, clerkUserId, sessionEmail, initialBusinessId]);

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
      if (b?.id) {
        warmTenantPresentationSkin(qc, b.id, b as Business);
        void prefetchTenantDashboardShell(qc, b.id).then(() => {
          applyTenantShellFromCache(qc, b.id);
        });
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
