import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useClerk, useSignIn } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  fetchDemoCatalog,
  requestDemoQuickSignIn,
  requestDemoSignIn,
  type DemoPersonaId,
} from "@/lib/demo-portal";
import { completeDemoPortalSignIn } from "@/lib/demo/complete-demo-portal-sign-in";

/** `/demo/open?persona=owner` or `?email=…` — sign-in in a fresh tab (Ctrl+click from launcher). */
export default function DemoOpenPersonaPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signOut, setActive, session } = useClerk();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!signInLoaded || !signIn || started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const persona = params.get("persona") as DemoPersonaId | null;
    const email = params.get("email")?.trim() ?? "";

    if (!persona && !email) {
      setError("Missing persona or email — open a role from /demo.");
      return;
    }

    void (async () => {
      try {
        const [result, catalog] = await Promise.all([
          email ? requestDemoQuickSignIn(email) : requestDemoSignIn(persona!),
          fetchDemoCatalog().catch(() => null),
        ]);
        const password = catalog?.sharedPassword ?? catalog?.devPassword;

        if (result.signInStrategy === "public") {
          navigate(result.landingPath);
          return;
        }

        await completeDemoPortalSignIn({
          signIn,
          clerk: { signOut, setActive, sessionId: session?.id },
          result,
          password,
          queryClient,
          navigate,
          useGatewayVeil: false,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not sign in");
      }
    })();
  }, [navigate, queryClient, session?.id, setActive, signIn, signInLoaded, signOut]);

  if (error) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center bg-background">
        <p className="text-sm text-destructive max-w-md">{error}</p>
        <a href="/demo" className="text-sm text-primary underline underline-offset-2">
          Back to demo
        </a>
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-background"
      data-testid="demo-open-persona"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">Signing in…</p>
    </div>
  );
}