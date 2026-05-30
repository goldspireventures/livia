import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { isPublicGuestPath } from "@/lib/public-guest-paths";

type MeOperatorSurface = {
  platformExec?: boolean;
  opsPortalUrl?: string | null;
};

/**
 * Livia Inc operators — hand off to internal ops app instead of tenant onboarding.
 * Server is source of truth via GET /api/me (platformExec, opsPortalUrl).
 */
export function PlatformExecHandoff({ children }: { children: React.ReactNode }) {
  const { isLoaded: clerkLoaded } = useUser();
  const [location] = useLocation();
  const { data: me, isLoading: meLoading, isError } = useQuery({
    queryKey: ["me-operator-surface"],
    queryFn: () => apiFetch<MeOperatorSurface>("/me"),
    enabled: clerkLoaded,
    retry: false,
    staleTime: 60_000,
  });

  const isExec = clerkLoaded && !meLoading && !isError && me?.platformExec === true;
  const opsUrl = me?.opsPortalUrl ?? null;
  const skipHandoff = isPublicGuestPath(location);

  useEffect(() => {
    if (skipHandoff || !isExec || !opsUrl) return;
    try {
      if (typeof window !== "undefined" && window.location.origin !== new URL(opsUrl).origin) {
        window.location.replace(opsUrl);
      }
    } catch {
      /* invalid ops URL — stay on tenant app */
    }
  }, [isExec, opsUrl, skipHandoff]);

  if (skipHandoff) {
    return <>{children}</>;
  }

  if (!clerkLoaded || meLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isExec && opsUrl) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Opening Livia operator console…</p>
        <a href={opsUrl} className="text-sm text-primary underline">
          Continue manually
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
