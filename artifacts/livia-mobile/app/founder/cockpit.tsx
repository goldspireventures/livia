import { Redirect } from "expo-router";

/** Legacy path — redirects to hidden exec surface. */
export default function LegacyFounderCockpitRedirect() {
  return <Redirect href="/_internal/desk" />;
}
