import { Link } from "react-router-dom";
import { SupportSurfaceNav } from "../components/SupportSurfaceNav";

/** I4 Investigate stub — paste requestId / surfaceId (Track B1 expands). */
export function SupportInvestigateView() {
  return (
    <div>
      <SupportSurfaceNav />
      <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>Investigate</h1>
      <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, maxWidth: 520 }}>
        Paste a <code>requestId</code> from Support thread context or API logs. Full trace wiring ships with
        Track B1 surface registry.
      </p>
      <p style={{ fontSize: 12, marginTop: 16 }}>
        <Link to="/support" style={{ color: "#38bdf8" }}>
          ← Back to thread queue
        </Link>
      </p>
    </div>
  );
}
