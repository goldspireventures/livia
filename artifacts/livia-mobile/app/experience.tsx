import { Redirect } from "expo-router";

/** Legacy route — demo path lives at /demo-guide */
export default function ExperienceRedirect() {
  return <Redirect href="/demo-guide" />;
}
