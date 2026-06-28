import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_DOOR_KEY = "livia.mobile.lastDoor";
const FORCE_COLD_OPEN_KEY = "livia.mobile.forceColdOpen";

/** Set before navigating to sign-up from cold open so stale verify UI is cleared on focus. */
let pendingSignUpFormReset = false;

export function markSignUpFormReset(): void {
  pendingSignUpFormReset = true;
}

export function consumeSignUpFormReset(): boolean {
  if (!pendingSignUpFormReset) return false;
  pendingSignUpFormReset = false;
  return true;
}

export type MobileEntryDoor = "guest" | "operator";

export async function rememberGuestDoor(): Promise<void> {
  await AsyncStorage.multiSet([
    [LAST_DOOR_KEY, "guest"],
    [FORCE_COLD_OPEN_KEY, ""],
  ]);
}

export async function rememberOperatorDoor(): Promise<void> {
  await AsyncStorage.multiSet([
    [LAST_DOOR_KEY, "operator"],
    [FORCE_COLD_OPEN_KEY, ""],
  ]);
}

/** After explicit sign-out or back to cold open — skip auto-redirect on `/`. */
export async function setForceColdOpen(): Promise<void> {
  await AsyncStorage.setItem(FORCE_COLD_OPEN_KEY, "1");
}

/** Navigate back to cold open — clears auto-redirect so AuthGate stays on `/`. */
export async function goToColdOpen(router: { replace: (path: string) => void }): Promise<void> {
  await setForceColdOpen();
  router.replace("/");
}

export async function resolveMobileEntryRedirect(): Promise<"stay" | "/sign-in" | "/my-livia"> {
  const [[, force], [, door]] = await AsyncStorage.multiGet([FORCE_COLD_OPEN_KEY, LAST_DOOR_KEY]);
  if (force === "1") return "stay";
  if (door === "operator") return "/sign-in";
  if (door === "guest") return "/my-livia";
  return "stay";
}
