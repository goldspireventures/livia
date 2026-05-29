import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { getOpsPortalUrl, isPlatformExecEmail } from "@/lib/platform-exec";

/**
 * Livia Inc operators — hand off to internal ops app instead of tenant onboarding.
 * Does not expose route names; uses env-configured portal URL only.
 */
export function PlatformExecHandoff({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  const isExec = isLoaded && isPlatformExecEmail(email);

  useEffect(() => {
    if (!isExec) return;
    const target = getOpsPortalUrl();
    if (typeof window !== "undefined" && window.location.origin !== new URL(target).origin) {
      window.location.replace(target);
    }
  }, [isExec]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isExec) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Opening Livia operator console…</p>
        <a href={getOpsPortalUrl()} className="text-sm text-primary underline">
          Continue manually
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
