import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { clearTenantSessionStorage } from "@/lib/tenant-session-storage";

/** Drop cached tenant data when Clerk user id changes (sign-up / account switch). */
export function useAuthSessionReset(): void {
  const { userId, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      if (!isSignedIn) {
        clearTenantSessionStorage();
      }
      previousUserId.current = null;
      return;
    }

    if (previousUserId.current && previousUserId.current !== userId) {
      clearTenantSessionStorage();
      queryClient.clear();
    }

    previousUserId.current = userId;
  }, [isSignedIn, userId, queryClient]);
}
