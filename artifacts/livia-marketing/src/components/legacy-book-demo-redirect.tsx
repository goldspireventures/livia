import { useEffect } from "react";
import { useLocation } from "wouter";
import { marketingGetStartedPath } from "@/lib/marketing-links";

/** Retired /book-demo — preserve query string (e.g. ?vertical=beauty) on get-started. */
export function LegacyBookDemoRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qs = params.toString();
    setLocation(qs ? `${marketingGetStartedPath}?${qs}` : marketingGetStartedPath);
  }, [setLocation]);

  return null;
}
