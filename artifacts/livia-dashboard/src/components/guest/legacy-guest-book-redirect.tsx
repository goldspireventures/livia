import { Redirect, useLocation } from "wouter";
import { migrateLegacyGuestBookPath } from "@workspace/policy";

/** 301-style client redirect `/b/...` → `/book/...` — preserve query (preview, service, UTM). */
export function LegacyGuestBookRedirect() {
  const [location] = useLocation();
  const target = migrateLegacyGuestBookPath(location.split("?")[0] ?? "/b");
  const qs =
    typeof window !== "undefined" && window.location.search
      ? window.location.search
      : location.includes("?")
        ? location.slice(location.indexOf("?"))
        : "";
  return <Redirect to={`${target}${qs}`} />;
}
