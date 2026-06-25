import { useEffect, type ReactNode } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { GatewayAuthPageShell } from "@/components/gateway/gateway-auth-page-shell";
import { readSignInRedirectPath } from "@/lib/local-dashboard-auth";

type Mode = "sign-in" | "sign-up";

export function GatewayAuthSessionGate({
  mode,
  children,
}: {
  mode: Mode;
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || mode !== "sign-in") return;
    navigate(readSignInRedirectPath() ?? "/dashboard", { replace: true });
  }, [isLoaded, isSignedIn, mode, navigate]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (isSignedIn && mode === "sign-in") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (isSignedIn && mode === "sign-up") {
    const email = user?.primaryEmailAddress?.emailAddress ?? "your account";

    return (
      <GatewayAuthPageShell
        title="Already signed in"
        subtitle={email}
        headerAction={{ href: "/dashboard", label: "Open Livia" }}
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Sign out to register a different email.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" type="button" onClick={() => navigate("/dashboard")}>
              Open Livia
            </Button>
            <Button
              className="flex-1"
              type="button"
              variant="outline"
              onClick={() =>
                void signOut({
                  redirectUrl: `${window.location.origin}/sign-up`,
                })
              }
            >
              Sign out
            </Button>
          </div>
        </div>
      </GatewayAuthPageShell>
    );
  }

  return <>{children}</>;
}
