import { useAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyBusinessesQueryKey } from "@workspace/api-client-react";
import { resolveStaffInviteHandoff } from "@workspace/policy";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { GatewayScreenShell } from "@/components/gateway/GatewayScreenShell";
import { fonts, type } from "@/constants/typography";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import { acceptPendingInvitations } from "@/lib/accept-invitations";
import { rememberOperatorDoor } from "@/lib/mobile-entry-routing";
import { fetchMeProfile } from "@/lib/platform-legal";
import { parseStaffInviteTicket } from "@/lib/staff-invite-link";

type Phase = "loading" | "ticket" | "accept" | "error";

/**
 * Staff invitation landing — Clerk redirect target after invite email.
 * Owner-assigned role in invite metadata drives persona after accept.
 */
export default function StaffInviteScreen() {
  const { tokens: colors } = useMobileSurface("gateway-auth");
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ __clerk_ticket?: string; ticket?: string }>();
  const routeTicket =
    (typeof params.__clerk_ticket === "string" && params.__clerk_ticket) ||
    (typeof params.ticket === "string" && params.ticket) ||
    null;
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
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

        const ticket = await parseStaffInviteTicket(routeTicket);
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
    const { accepted } = await acceptPendingInvitations();
    await rememberOperatorDoor();
    await queryClient.invalidateQueries({ queryKey: getGetMyBusinessesQueryKey() });
    const me = await fetchMeProfile().catch(() => null);
    const handoff = resolveStaffInviteHandoff({
      surface: "mobile",
      accepted,
      platformLegalAccepted: Boolean(me?.platformLegalAccepted),
    });
    router.replace(handoff.path as never);
  }

  return (
    <GatewayScreenShell surfaceId="gateway-auth" testID="staff-invite-screen">
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
        {phase !== "error" ? <ActivityIndicator size="large" color={colors.primary} /> : null}
        <Text style={[type.body, { color: colors.foreground, textAlign: "center", fontFamily: fonts.bodyMed }]}>
          {message}
        </Text>
        {phase === "error" ? (
          <Pressable onPress={() => router.replace("/sign-in" as never)} hitSlop={8}>
            <Text style={[type.caption, { color: colors.primary, textAlign: "center" }]}>Sign in instead →</Text>
          </Pressable>
        ) : null}
      </View>
    </GatewayScreenShell>
  );
}
