// Membership + persona switcher state.
//
// Two ideas live here:
// 1. The user's actual `role` for the current business (OWNER/ADMIN/STAFF).
//    This is sourced from the API and is immutable for a given session.
// 2. The user's chosen `viewingAs` persona. OWNER/ADMIN can opt into a
//    STAFF read-only view via the persona switcher; this gets persisted
//    to localStorage AND registered as a global query-param injector on
//    the shared customFetch so every generated hook automatically picks
//    up `?as=staff:<id>` for the duration of the impersonation.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { setRequestQueryParamGetter } from "@workspace/api-client-react";
import { apiFetch } from "./api-fetch";
import { useBusiness } from "./business-context";

export type Role = "OWNER" | "ADMIN" | "STAFF";

interface MembershipResponse {
  businessId: string;
  role: Role;
  staffId: string | null;
}

interface MembershipContextType {
  role: Role | null;
  effectiveRole: Role | null;
  ownStaffId: string | null;
  // OWNER/ADMIN may impersonate a specific staffId. STAFF cannot.
  viewingAsStaffId: string | null;
  setViewingAsStaffId: (id: string | null) => void;
  isLoading: boolean;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

const LS_KEY = "livia.viewingAsStaffId";

export function MembershipProvider({ children }: { children: ReactNode }) {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["membership", businessId],
    queryFn: () =>
      apiFetch<MembershipResponse>(`/me/businesses/${businessId}/membership`),
    enabled: !!businessId,
    staleTime: 60_000,
  });

  const [viewingAsStaffId, setViewingAsStaffIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(LS_KEY);
  });

  // Reset persona only when the business *actually changes* — not on initial
  // mount or refetches. We track the previous businessId in a ref so the very
  // first render (where prev === current === resolved id) doesn't wipe LS.
  const prevBusinessIdRef = useRef<string | null>(businessId);
  useEffect(() => {
    if (prevBusinessIdRef.current !== null && prevBusinessIdRef.current !== businessId) {
      // Genuinely switched tenants — drop persona to avoid leaking across.
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LS_KEY);
      }
      setViewingAsStaffIdState(null);
    }
    prevBusinessIdRef.current = businessId;
  }, [businessId]);

  const setViewingAsStaffId = (id: string | null) => {
    setViewingAsStaffIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(LS_KEY, id);
      else window.localStorage.removeItem(LS_KEY);
    }
    // Force every cached query to refetch under the new persona scope.
    queryClient.invalidateQueries();
  };

  const role = data?.role ?? null;
  const ownStaffId = data?.staffId ?? null;
  const canImpersonate = role === "OWNER" || role === "ADMIN";
  const activeStaffId = canImpersonate ? viewingAsStaffId : null;
  const effectiveRole: Role | null =
    role === "STAFF" ? "STAFF" : activeStaffId ? "STAFF" : role;

  // Register a global query-param injector so the generated orval client
  // automatically appends `?as=staff:<id>` for every request while the
  // OWNER/ADMIN is impersonating. This is the *only* way to ensure all
  // hooks (bookings/customers/dashboard/...) see the persona without
  // having to thread `viewingAsStaffId` through every call site.
  useEffect(() => {
    if (!activeStaffId) {
      setRequestQueryParamGetter(null);
      return;
    }
    setRequestQueryParamGetter(() => ({ as: `staff:${activeStaffId}` }));
    return () => {
      setRequestQueryParamGetter(null);
    };
  }, [activeStaffId]);

  const value = useMemo(
    () => ({
      role,
      effectiveRole,
      ownStaffId,
      viewingAsStaffId: activeStaffId,
      setViewingAsStaffId,
      isLoading,
    }),
    [role, effectiveRole, ownStaffId, activeStaffId, isLoading],
  );

  return (
    <MembershipContext.Provider value={value}>{children}</MembershipContext.Provider>
  );
}

export function useMembership() {
  const ctx = useContext(MembershipContext);
  if (!ctx) {
    throw new Error("useMembership must be used within MembershipProvider");
  }
  return ctx;
}

/** Returns `?as=staff:<id>` (with leading `?`) or `""`. */
export function personaQuery(viewingAsStaffId: string | null): string {
  return viewingAsStaffId ? `?as=staff:${encodeURIComponent(viewingAsStaffId)}` : "";
}
