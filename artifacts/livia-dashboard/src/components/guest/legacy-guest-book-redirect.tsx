import { Redirect, useLocation } from "wouter";
import { migrateLegacyGuestBookPath } from "@workspace/policy";

/** 301-style client redirect `/b/...` → `/book/...` */
export function LegacyGuestBookRedirect() {
  const [location] = useLocation();
  const target = migrateLegacyGuestBookPath(location.split("?")[0] ?? "/b");
  const qs = location.includes("?") ? location.slice(location.indexOf("?")) : "";
  return <Redirect to={`${target}${qs}`} />;
}
