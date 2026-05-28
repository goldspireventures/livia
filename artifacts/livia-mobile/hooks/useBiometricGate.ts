import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

const SKIP_KEY = "livia.settings.biometricSkip";

export async function getBiometricSkipPreference(): Promise<boolean> {
  return (await AsyncStorage.getItem(SKIP_KEY)) === "true";
}

export async function setBiometricSkipPreference(skip: boolean): Promise<void> {
  if (skip) await AsyncStorage.setItem(SKIP_KEY, "true");
  else await AsyncStorage.removeItem(SKIP_KEY);
}

export function useBiometricGate() {
  const [unlocked, setUnlocked] = useState(Platform.OS === "web");
  const [skipEnabled, setSkipEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(Platform.OS === "web");

  useEffect(() => {
    if (Platform.OS === "web") return;
    getBiometricSkipPreference().then((skip) => {
      setSkipEnabled(skip);
      if (skip) setUnlocked(true);
      setHydrated(true);
    });
  }, []);

  const requireUnlock = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web" || skipEnabled) {
      setUnlocked(true);
      return true;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) {
      setUnlocked(true);
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Livia",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    if (result.success) {
      setUnlocked(true);
      return true;
    }
    return false;
  }, [skipEnabled]);

  const lock = useCallback(() => {
    if (Platform.OS !== "web" && !skipEnabled) setUnlocked(false);
  }, [skipEnabled]);

  const skipForSession = useCallback(async () => {
    await setBiometricSkipPreference(true);
    setSkipEnabled(true);
    setUnlocked(true);
  }, []);

  return { unlocked, requireUnlock, lock, skipForSession, skipEnabled, hydrated };
}
