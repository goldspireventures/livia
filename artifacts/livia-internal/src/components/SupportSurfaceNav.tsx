import { useLocation } from "react-router-dom";
import { InternalSubNav } from "./InternalSubNav";

const MODES = [
  { id: "inbox", to: "/support", label: "Inbox", hint: "Work tickets" },
  { id: "board", to: "/support/board", label: "Board", hint: "By status" },
  { id: "radar", to: "/support/radar", label: "Radar", hint: "What needs attention" },
  { id: "investigate", to: "/support/investigate", label: "Trace", hint: "Request ID lookup" },
] as const;

function activeMode(pathname: string): string {
  if (pathname.startsWith("/support/board")) return "board";
  if (pathname.startsWith("/support/radar")) return "radar";
  if (pathname.startsWith("/support/investigate")) return "investigate";
  return "inbox";
}

export function SupportSurfaceNav() {
  const { pathname } = useLocation();
  const mode = activeMode(pathname);

  return (
    <div data-testid="support-surface-nav">
      <InternalSubNav items={[...MODES]} activeId={mode} aria-label="Support views" />
    </div>
  );
}
