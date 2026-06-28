import AsyncStorage from "@react-native-async-storage/async-storage";

const CLERK_PK_FINGERPRINT_KEY = "livia.mobile.clerkPkFingerprint";

/** Drop stale Clerk client state when switching pk_test ↔ pk_live (e.g. prod device testing). */
export async function ensureFreshClerkInstance(publishableKey: string): Promise<void> {
  const pk = publishableKey.trim();
  if (!pk) return;
  const prev = await AsyncStorage.getItem(CLERK_PK_FINGERPRINT_KEY);
  if (prev && prev !== pk) {
    const keys = await AsyncStorage.getAllKeys();
    const clerkKeys = keys.filter((k) => /clerk/i.test(k));
    if (clerkKeys.length) {
      await AsyncStorage.multiRemove(clerkKeys);
    }
  }
  await AsyncStorage.setItem(CLERK_PK_FINGERPRINT_KEY, pk);
}
