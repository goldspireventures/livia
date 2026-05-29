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
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { isPlatformExecEmail } from "@/lib/platform-exec";
import {
  setAuthTokenGetter,
  setBaseUrl,
} from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { isDemoRoute } from "@/lib/navigation";
import { consumeMobileHomeRoute } from "@/lib/demo-session";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BusinessProvider } from "@/contexts/BusinessContext";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { usePushNavigation } from "@/hooks/usePushNavigation";
import { getApiBaseUrl } from "@/lib/api-base";
import { initMobileSentry } from "@/lib/sentry";

// Set API base URL at module level — runs once before any component mounts.
setBaseUrl(getApiBaseUrl());
initMobileSentry();

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
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const segments = useSegments();

  const execEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;

  useEffect(() => {
    if (!isLoaded) return;
    const onSignIn = segments[0] === "sign-in";
    const onExecDesk = segments[0] === "_internal";
    // ADR 0010 / docs/demo-gateway.md — `/demo` is a public showcase. It must
    // not require Clerk so a prospect can tap a link and step inside any of
    // the seven persona doors without an account.
    const onDemo = isDemoRoute(segments);
    const onPublicBook = segments[0] === "public-book";
    const allowDemo =
      onDemo &&
      (process.env.EXPO_PUBLIC_DEMO_LOGIN === "true" || __DEV__);
    if (onDemo && !allowDemo) {
      router.replace("/sign-in");
      return;
    }
    if (!isSignedIn && !onSignIn && !allowDemo && !onPublicBook) {
      router.replace("/sign-in");
    } else if (isSignedIn && onSignIn) {
      void (async () => {
        if (isPlatformExecEmail(execEmail)) {
          router.replace("/_internal/desk" as never);
          return;
        }
        const home = await consumeMobileHomeRoute();
        router.replace((home ?? "/(tabs)") as never);
      })();
    } else if (isSignedIn && isPlatformExecEmail(execEmail) && !onExecDesk && !onDemo && !onPublicBook) {
      router.replace("/_internal/desk" as never);
    }
  }, [isSignedIn, isLoaded, segments, router, execEmail]);

  return <>{children}</>;
}

function PushRegistrationBridge() {
  usePushRegistration();
  usePushNavigation();
  return null;
}

function RootLayoutNav() {
  return (
    <BusinessProvider>
      <PushRegistrationBridge />
      <AuthGate>
        <Stack
          screenOptions={{
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: "transparent" },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="demo/index" options={{ headerShown: false }} />
          <Stack.Screen name="demo/[persona]" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-setup" options={{ title: "Setup essentials" }} />
          <Stack.Screen name="onboarding-continue" options={{ title: "Setup" }} />
          <Stack.Screen name="experience" options={{ title: "Experience" }} />
          <Stack.Screen name="demo-guide" options={{ headerShown: false }} />
          <Stack.Screen name="public-book/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[id]" options={{ title: "Booking" }} />
          <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="booking/new" options={{ title: "New Booking" }} />
          <Stack.Screen name="customer/[id]" options={{ title: "Client" }} />
          <Stack.Screen name="customer/new" options={{ title: "New Client" }} />
          <Stack.Screen name="staff/index" options={{ title: "Staff" }} />
          <Stack.Screen name="staff/invite" options={{ title: "Invite" }} />
          <Stack.Screen name="staff/[id]" options={{ title: "Staff Member" }} />
          <Stack.Screen name="services/index" options={{ title: "Services" }} />
          <Stack.Screen name="service/new" options={{ title: "New Service" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen name="_internal/desk" options={{ title: "Overview", headerShown: false }} />
          <Stack.Screen name="founder/cockpit" options={{ headerShown: false }} />
          <Stack.Screen name="plan" options={{ title: "Plan" }} />
          <Stack.Screen name="design-proofs" options={{ title: "Design proofs" }} />
          <Stack.Screen name="clinical-hub" options={{ title: "Clinical hub" }} />
          <Stack.Screen name="liv-mandate" options={{ title: "Liv Mandate" }} />
          <Stack.Screen name="accountant-preview" options={{ title: "Accountant preview" }} />
          <Stack.Screen name="audit" options={{ title: "Audit" }} />
          <Stack.Screen name="lifecycle" options={{ title: "Lifecycle" }} />
          <Stack.Screen name="host" options={{ title: "Host floor" }} />
          <Stack.Screen name="brands" options={{ title: "Brands" }} />
          <Stack.Screen name="premises" options={{ headerShown: false }} />
          <Stack.Screen name="day-packages" options={{ headerShown: false }} />
          <Stack.Screen name="rota" options={{ title: "Team rota" }} />
          <Stack.Screen name="time-off" options={{ title: "Request leave" }} />
        </Stack>
      </AuthGate>
    </BusinessProvider>
  );
}

export default function RootLayout() {
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
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider
            publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""}
            tokenCache={tokenCache}
          >
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#09090b" }}>
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
