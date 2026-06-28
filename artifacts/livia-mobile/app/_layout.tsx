import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { useBusiness } from "@/contexts/BusinessContext";
import { ensureFreshClerkInstance } from "@/lib/clerk-storage-reset";
import { fetchOperatorSurface } from "@/lib/operator-surface";
import {
  setAuthTokenGetter,
  setBaseUrl,
} from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { isDemoRoute, isGatewayRoute, isGuestPublicRoute, isStaffInviteRoute } from "@/lib/navigation";
import { GUEST_HUB_TOKEN_KEY } from "@/lib/guest-hub";
import { consumeMobileHomeRoute } from "@/lib/demo-session";
import { isDemoMobileSurface } from "@/lib/production-surface";
import { resolveMobileEntryRedirect, setForceColdOpen } from "@/lib/mobile-entry-routing";
import { fetchMeProfile } from "@/lib/platform-legal";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { isPushSupportedInThisBuild } from "@/lib/push-notifications";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingGate } from "@/components/OnboardingGate";
import { BusinessProvider } from "@/contexts/BusinessContext";
import { PresentationThemeProvider } from "@/contexts/PresentationThemeContext";
import { TenantPresentationShell } from "@/components/shell/TenantPresentationShell";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { usePushNavigation } from "@/hooks/usePushNavigation";
import { getApiBaseUrl } from "@/lib/api-base";
import { initMobileSentry } from "@/lib/sentry";

// Set API base URL at module level — runs once before any component mounts.
setBaseUrl(getApiBaseUrl());
initMobileSentry();

if (!isPushSupportedInThisBuild()) {
  LogBox.ignoreLogs([
    "expo-notifications: Android Push notifications",
    "expo-notifications: iOS Push notifications",
  ]);
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const tokenCache = {
  getToken: (key: string) => AsyncStorage.getItem(key),
  saveToken: (key: string, value: string) => AsyncStorage.setItem(key, value),
  clearToken: (key: string) => AsyncStorage.removeItem(key),
};

function ClerkAuthBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(async () => {
      try {
        return (await getToken()) ?? null;
      } catch {
        return null;
      }
    });
  }, [getToken]);
  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { businesses, isLoading: bizLoading, isDemoAccount } = useBusiness();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;
    const onSignIn = segments[0] === "sign-in";
    const onGateway = isGatewayRoute(segments);
    const onExecDesk = segments[0] === "_internal";
    const onDemo = isDemoRoute(segments);
    const onGuestPublic = isGuestPublicRoute(segments);
    const onStaffInvite = isStaffInviteRoute(segments);
    const allowDemo = onDemo && isDemoMobileSurface();
    if (onDemo && !allowDemo) {
      router.replace("/");
      return;
    }
    if (!isSignedIn && onGateway) {
      void (async () => {
        const hubToken = await AsyncStorage.getItem(GUEST_HUB_TOKEN_KEY);
        if (hubToken) {
          router.replace("/my-livia" as never);
          return;
        }
        const dest = await resolveMobileEntryRedirect();
        if (dest !== "stay") {
          router.replace(dest as never);
        }
      })();
      return;
    }
    if (!isSignedIn && !onGateway && !onSignIn && !allowDemo && !onGuestPublic && !onStaffInvite) {
      router.replace("/");
      return;
    }
    if (isSignedIn && !onExecDesk && !onDemo && !onGuestPublic && !onGateway) {
      void (async () => {
        const surface = await fetchOperatorSurface(() => getToken());
        if (surface?.platformExec) {
          router.replace("/_internal/desk" as never);
        }
      })();
    }
  }, [isSignedIn, isLoaded, segments, router, getToken]);

  // After auth, route founders with no shop to create-business (not empty tabs).
  useEffect(() => {
    if (!isLoaded || !isSignedIn || bizLoading) return;
    const onSignIn = segments[0] === "sign-in";
    const onGateway = isGatewayRoute(segments);
    if (!onSignIn && !onGateway) return;

    void (async () => {
      const surface = await fetchOperatorSurface(() => getToken());
      if (surface?.platformExec) {
        router.replace("/_internal/desk" as never);
        return;
      }
      const home = await consumeMobileHomeRoute();
      if (home) {
        router.replace(home as never);
        return;
      }
      if (!isDemoAccount && businesses.length === 0) {
        try {
          const me = await fetchMeProfile();
          if (!me.platformLegalAccepted) {
            router.replace("/legal-acceptance" as never);
            return;
          }
        } catch {
          router.replace("/legal-acceptance" as never);
          return;
        }
        router.replace("/onboarding" as never);
        return;
      }
      router.replace("/(tabs)" as never);
    })();
  }, [
    isLoaded,
    isSignedIn,
    bizLoading,
    businesses.length,
    isDemoAccount,
    segments,
    router,
    getToken,
  ]);

  return <>{children}</>;
}

function PushRegistrationBridge() {
  usePushRegistration();
  usePushNavigation();
  return null;
}

function OperatorPresentationGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { currentBusiness } = useBusiness();
  if (!isSignedIn || !currentBusiness?.id) return <>{children}</>;
  return <TenantPresentationShell>{children}</TenantPresentationShell>;
}

function RootLayoutNav() {
  return (
    <BusinessProvider>
      <PresentationThemeProvider>
      <PushRegistrationBridge />
      <AuthGate>
        <OnboardingGate>
        <OperatorPresentationGate>
        <Stack
          screenOptions={{
            headerBackTitle: "Back",
            headerShown: false,
            headerStyle: { backgroundColor: "transparent" },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false, gestureEnabled: true }} />
          <Stack.Screen name="staff-invite" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="legal-acceptance" options={{ headerShown: false }} />
          <Stack.Screen name="my" options={{ headerShown: false }} />
          <Stack.Screen name="demo/index" options={{ headerShown: false }} />
          <Stack.Screen name="demo/wedge/[vertical]" options={{ headerShown: false }} />
          <Stack.Screen name="demo/[persona]" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-setup" options={{ title: "Setup essentials" }} />
          <Stack.Screen name="onboarding-continue" options={{ title: "Setup" }} />
          <Stack.Screen name="experience" options={{ title: "Experience" }} />
          <Stack.Screen name="demo-guide" options={{ headerShown: false }} />
          <Stack.Screen name="public-book/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="my-livia/index" options={{ headerShown: false, gestureEnabled: true }} />
          <Stack.Screen name="my-livia/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="my-livia/[slug]/visit/[bookingId]" options={{ headerShown: false }} />
          <Stack.Screen name="guest-surface" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="booking/new" options={{ headerShown: false }} />
          <Stack.Screen name="customer/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="customer/new" options={{ headerShown: false }} />
          <Stack.Screen name="staff/index" options={{ headerShown: false }} />
          <Stack.Screen name="staff/invite" options={{ headerShown: false }} />
          <Stack.Screen name="staff/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="services/index" options={{ headerShown: false }} />
          <Stack.Screen name="enquiries" options={{ headerShown: false }} />
          <Stack.Screen name="quotes" options={{ headerShown: false }} />
          <Stack.Screen name="event-site" options={{ headerShown: false }} />
          <Stack.Screen name="service/new" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="_internal/desk" options={{ title: "Overview", headerShown: false }} />
          <Stack.Screen name="founder/cockpit" options={{ headerShown: false }} />
          <Stack.Screen name="plan" options={{ headerShown: false }} />
          <Stack.Screen name="design-proofs" options={{ headerShown: false }} />
          <Stack.Screen name="clinical-hub" options={{ headerShown: false }} />
          <Stack.Screen name="liv-mandate" options={{ headerShown: false }} />
          <Stack.Screen name="accountant-preview" options={{ headerShown: false }} />
          <Stack.Screen name="audit" options={{ headerShown: false }} />
          <Stack.Screen name="lifecycle" options={{ headerShown: false }} />
          <Stack.Screen name="host" options={{ headerShown: false }} />
          <Stack.Screen name="brands" options={{ headerShown: false }} />
          <Stack.Screen name="premises" options={{ headerShown: false }} />
          <Stack.Screen name="day-packages" options={{ headerShown: false }} />
          <Stack.Screen name="rota" options={{ headerShown: false }} />
          <Stack.Screen name="time-off" options={{ headerShown: false }} />
        </Stack>
        </OperatorPresentationGate>
        </OnboardingGate>
      </AuthGate>
      </PresentationThemeProvider>
    </BusinessProvider>
  );
}

export default function RootLayout() {
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const [clerkStorageReady, setClerkStorageReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
  });

  useEffect(() => {
    void ensureFreshClerkInstance(clerkPublishableKey).finally(() => setClerkStorageReady(true));
  }, [clerkPublishableKey]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;
  if (!clerkStorageReady) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            tokenCache={tokenCache}
          >
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#2c2f3a" }}>
              <KeyboardProvider>
                <StatusBar style="light" />
                <ClerkAuthBridge />
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </ClerkProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
