import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_DOOR_KEY = "livia.mobile.lastDoor";
const FORCE_COLD_OPEN_KEY = "livia.mobile.forceColdOpen";

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

/** After explicit sign-out — show cold open again on next visit. */
export async function setForceColdOpen(): Promise<void> {
  await AsyncStorage.setItem(FORCE_COLD_OPEN_KEY, "1");
}

export async function resolveMobileEntryRedirect(): Promise<"stay" | "/sign-in" | "/my-livia"> {
  const [[, force], [, door]] = await AsyncStorage.multiGet([FORCE_COLD_OPEN_KEY, LAST_DOOR_KEY]);
  if (force === "1") return "stay";
  if (door === "operator") return "/sign-in";
  if (door === "guest") return "/my-livia";
  return "stay";
}
