import { Redirect } from "expo-router";

/** Slot waitlist is Liv-managed — deep links land on Today. */
export default function WaitlistScreen() {
  return <Redirect href="/(tabs)" />;
}
