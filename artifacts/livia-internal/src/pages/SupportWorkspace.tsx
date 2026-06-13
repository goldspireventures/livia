import { Link, Outlet, useLocation } from "react-router-dom";
import { InternalPage } from "../components/InternalPage";
import { SupportSurfaceNav } from "../components/SupportSurfaceNav";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";
import { ghostButtonStyle } from "../styles/ops-ui";

function workspaceMode(pathname: string): keyof typeof MODE_META {
  if (pathname.startsWith("/support/board")) return "board";
  if (pathname.startsWith("/support/radar")) return "radar";
  if (pathname.startsWith("/support/investigate")) return "investigate";
  return "inbox";
}

const MODE_META = {
  inbox: INTERNAL_PAGES.supportInbox,
  board: INTERNAL_PAGES.supportBoard,
  radar: INTERNAL_PAGES.supportRadar,
  investigate: INTERNAL_PAGES.supportInvestigate,
} as const;

export function SupportWorkspace() {
  const location = useLocation();
  const mode = workspaceMode(location.pathname);
  const meta = MODE_META[mode];
  const isThread = mode === "inbox";

  return (
    <InternalPage
      wide
      title={meta.title}
      subtitle={meta.purpose}
      actions={
        <Link
          to="/knowledge?doc=operations/support-runbook.md"
          style={{ ...ghostButtonStyle, fontSize: 12, padding: "6px 12px", textDecoration: "none" }}
        >
          Support runbook
        </Link>
      }
    >
      <SupportSurfaceNav />
      <div style={{ minHeight: isThread ? "calc(100vh - 220px)" : undefined }}>
        <Outlet />
      </div>
    </InternalPage>
  );
}
