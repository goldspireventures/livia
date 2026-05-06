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
import {
  setAuthTokenGetter,
  setBaseUrl,
} from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BusinessProvider } from "@/contexts/BusinessContext";

// Set API base URL at module level — runs once before any component mounts.
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

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
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;
    const onSignIn = segments[0] === "sign-in";
    if (!isSignedIn && !onSignIn) {
      router.replace("/sign-in");
    } else if (isSignedIn && onSignIn) {
      router.replace("/");
    }
  }, [isSignedIn, isLoaded, segments]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <BusinessProvider>
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
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[id]" options={{ title: "Booking" }} />
          <Stack.Screen name="booking/new" options={{ title: "New Booking" }} />
          <Stack.Screen name="customer/[id]" options={{ title: "Client" }} />
          <Stack.Screen name="staff/index" options={{ title: "Staff" }} />
          <Stack.Screen name="staff/[id]" options={{ title: "Staff Member" }} />
          <Stack.Screen name="services/index" options={{ title: "Services" }} />
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
