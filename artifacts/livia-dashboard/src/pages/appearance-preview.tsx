import { useEffect } from "react";
import { useLocation } from "wouter";
import { appearancePreviewDashboardPath } from "@/lib/appearance-preview-mode";

/** Legacy route — forwards to real /dashboard Today embed (scrollable, true shell). */
export default function AppearancePreviewPage() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const qs = location.includes("?") ? location.split("?")[1]! : "preview=1";
    setLocation(appearancePreviewDashboardPath(qs), { replace: true });
  }, [location, setLocation]);

  return null;
}
