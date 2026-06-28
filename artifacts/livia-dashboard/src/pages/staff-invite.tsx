import { useAuth, useSignIn, useSignUp } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { getMyBusinesses } from "@workspace/api-client-react";
import { resolveStaffInviteHandoff } from "@workspace/policy";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api-fetch";

type Phase = "loading" | "ticket" | "accept" | "error";

function ticketFromSearch(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("__clerk_ticket") || params.get("ticket");
}

/**
 * Staff invitation landing — Clerk redirect target after invite email.
 * Owner-assigned role in invite metadata drives persona after accept.
 */
export default function StaffInvitePage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const routeTicket = useMemo(() => ticketFromSearch(), []);
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState("Opening your team invite…");

  useEffect(() => {
    if (!isLoaded) return;

    void (async () => {
      try {
        if (isSignedIn) {
          await finishInvite();
          return;
        }

        const ticket = routeTicket;
        if (!ticket) {
          setPhase("error");
          setMessage("Open the invitation link from your email, or sign in if you already joined.");
          return;
        }

        if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;

        setPhase("ticket");
        setMessage("Confirming your invitation…");

        let sessionReady = false;
        try {
          const signInAttempt = await signIn.create({ strategy: "ticket", ticket });
          if (signInAttempt.status === "complete" && signInAttempt.createdSessionId) {
            await setActiveSignIn({ session: signInAttempt.createdSessionId });
            sessionReady = true;
          }
        } catch {
          const signUpAttempt = await signUp.create({ strategy: "ticket", ticket });
          if (signUpAttempt.status === "complete" && signUpAttempt.createdSessionId) {
            await setActiveSignUp({ session: signUpAttempt.createdSessionId });
            sessionReady = true;
          }
        }

        if (!sessionReady) {
          setPhase("error");
          setMessage("Could not complete your invitation. Try opening the link from your email again.");
          return;
        }

        await finishInvite();
      } catch {
        setPhase("error");
        setMessage("Something went wrong with your team invite. Try the link in your email again.");
      }
    })();
  }, [
    isLoaded,
    isSignedIn,
    signInLoaded,
    signUpLoaded,
    signIn,
    signUp,
    setActiveSignIn,
    setActiveSignUp,
    routeTicket,
  ]);

  async function finishInvite() {
    setPhase("accept");
    setMessage("Joining your team…");
    const accepted = await apiFetch<{ accepted: Array<{
      businessId: string;
      businessName: string;
      role: "STAFF" | "ADMIN";
      deskRole?: "manager" | "reception" | null;
      vertical?: string | null;
    }> }>("/me/accept-invitations", { method: "POST" });
    await queryClient.invalidateQueries({ queryKey: ["/me/businesses"] });
    await queryClient.invalidateQueries({ queryKey: ["accept-invitations"] });
    try {
      await queryClient.fetchQuery({
        queryKey: ["/me/businesses"],
        queryFn: () => getMyBusinesses(),
      });
    } catch {
      /* landing still works from accept payload */
    }
    const me = await apiFetch<{ platformLegalAccepted?: boolean }>("/me").catch(() => null);
    const handoff = resolveStaffInviteHandoff({
      surface: "web",
      accepted: accepted.accepted ?? [],
      platformLegalAccepted: Boolean(me?.platformLegalAccepted),
    });
    navigate(handoff.path, { replace: true });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      {phase !== "error" ? <Spinner className="h-8 w-8 text-primary" /> : null}
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {phase === "error" ? (
        <a href="/sign-in" className="text-sm font-medium text-primary underline underline-offset-2">
          Sign in instead
        </a>
      ) : null}
    </div>
  );
}
