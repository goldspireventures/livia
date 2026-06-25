import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@clerk/clerk-expo";
import { useGetMyBusinesses } from "@workspace/api-client-react";
import type { Business } from "@workspace/api-client-react";
import { useSegments } from "expo-router";
import {
  businessAllowedForDemo,
  clearDemoSession,
  getDemoSession,
  isActiveDemoSession,
  type DemoSession,
} from "@/lib/demo-session";
import { isDemoRoute } from "@/lib/navigation";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface BusinessContextValue {
  businesses: Business[];
  currentBusiness: Business | null;
  isLoading: boolean;
  isError: boolean;
  /** Set when signed in via demo ticket (demo-*@livia.io). */
  demoSession: DemoSession | null;
  isDemoAccount: boolean;
  setCurrentBusiness: (business: Business) => void;
  refetch: () => Promise<{ data: Business[] | undefined }>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);
// ADR 0010 — unified key across web + mobile. Web uses the same string in
// `artifacts/livia-dashboard/src/lib/business-context.tsx` so an org admin who
// switches business on her phone sees the change reflected next time she
// logs into the dashboard (and vice versa). One legacy key is migrated.
const STORAGE_KEY = "livia.currentBusinessId";
const LEGACY_KEYS = ["livia_current_business_id"];

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: clerkUserLoaded } = useUser();
  const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? null;
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(
    null
  );
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);

  // The /demo surface is a public, mocked walk-through (the "hotel principle"
  // showcase). It must not hit any tenant-aware endpoint, otherwise an
  // anonymous visitor would trigger /me/businesses and we'd leak the auth
  // boundary out of the demo. Disable the query while the user is inside the
  // demo route tree.
  const segments = useSegments();
  const inDemo = isDemoRoute(segments);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetMyBusinesses({
    query: { enabled: !inDemo, retry: 2, staleTime: 30_000 } as never,
  });

  const rawBusinesses: Business[] = data ?? [];
  const businesses = useMemo(() => {
    if (!demoSession?.businessSlugs?.length) return rawBusinesses;
    return rawBusinesses.filter((b) => businessAllowedForDemo(b.slug, demoSession));
  }, [rawBusinesses, demoSession]);

  useEffect(() => {
    void getDemoSession().then(setDemoSession);
  }, []);

  useEffect(() => {
    if (!clerkUserLoaded || !demoSession) return;
    if (!isActiveDemoSession(demoSession, clerkEmail)) {
      void clearDemoSession().then(() => setDemoSession(null));
    }
  }, [clerkUserLoaded, demoSession, clerkEmail]);

  useEffect(() => {
    // One-shot migration: walk the legacy keys (in priority order) and copy
    // the first one we find into the unified key, then clear all legacy keys.
    // Safe to run on every boot.
    (async () => {
      const current = await AsyncStorage.getItem(STORAGE_KEY);
      if (current) {
        setCurrentBusinessId(current);
        return;
      }
      for (const key of LEGACY_KEYS) {
        const legacy = await AsyncStorage.getItem(key);
        if (legacy) {
          await AsyncStorage.setItem(STORAGE_KEY, legacy);
          setCurrentBusinessId(legacy);
          break;
        }
      }
      // Clean up any remaining legacy keys regardless.
      await Promise.all(LEGACY_KEYS.map((k) => AsyncStorage.removeItem(k)));
    })();
  }, []);

  useEffect(() => {
    if (businesses.length === 0) return;
    const preferred: Business | undefined =
      (demoSession?.businessId
        ? businesses.find((b) => b.id === demoSession.businessId)
        : undefined) ??
      (demoSession?.primaryBusinessSlug
        ? businesses.find((b) => b.slug === demoSession.primaryBusinessSlug)
        : undefined) ??
      businesses[0];
    if (!preferred) return;
    if (!currentBusinessId) {
      setCurrentBusinessId(preferred.id);
      AsyncStorage.setItem(STORAGE_KEY, preferred.id);
      return;
    }
    if (!businesses.some((b) => b.id === currentBusinessId)) {
      setCurrentBusinessId(preferred.id);
      AsyncStorage.setItem(STORAGE_KEY, preferred.id);
    }
  }, [businesses, currentBusinessId, demoSession]);

  const currentBusiness = useMemo(
    () => businesses.find((b) => b.id === currentBusinessId) ?? businesses[0] ?? null,
    [businesses, currentBusinessId]
  );

  const setCurrentBusiness = (business: Business) => {
    setCurrentBusinessId(business.id);
    AsyncStorage.setItem(STORAGE_KEY, business.id);
  };

  const refetchBusinesses = async () => {
    const result = await refetch();
    return { data: result.data };
  };

  const isDemoAccount = useMemo(
    () => isActiveDemoSession(demoSession, clerkEmail),
    [demoSession, clerkEmail],
  );

  const value = useMemo(
    () => ({
      businesses,
      currentBusiness,
      isLoading,
      isError,
      demoSession,
      isDemoAccount,
      setCurrentBusiness,
      refetch: refetchBusinesses,
    }),
    [businesses, currentBusiness, isLoading, isError, demoSession, isDemoAccount, refetch]
  );

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used within BusinessProvider");
  return context;
}
