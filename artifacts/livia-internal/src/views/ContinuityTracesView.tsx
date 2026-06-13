import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";
import { InternalPage } from "../components/InternalPage";
import { cardStyle } from "../styles/ops-ui";

type Trace = {
  bookingId: string;
  businessName: string;
  businessSlug: string;
  customerName: string | null;
  status: string;
  pendingReason: string | null;
  continuitySentAt: string | null;
  startAt: string;
};

async function fetchTraces(secret: string): Promise<Trace[]> {
  const res = await fetch("/api/internal/ops/continuity-traces", {
    headers: { Accept: "application/json", "X-Internal-Ops-Secret": secret },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed");
  return data.data as Trace[];
}

export function ContinuityTracesView({ secret }: { secret: string }) {
  const [rows, setRows] = useState<Trace[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetchTraces(secret)
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, [secret]);

  if (err) {
    return (
      <InternalPage title={INTERNAL_PAGES.continuity.title} subtitle={INTERNAL_PAGES.continuity.purpose}>
        <p style={{ color: "#f87171" }}>{err}</p>
      </InternalPage>
    );
  }

  return (
    <InternalPage
      title={INTERNAL_PAGES.continuity.title}
      subtitle={`${rows.length} bookings — ${INTERNAL_PAGES.continuity.purpose}`}
      actions={
        <Link to="/platform" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}>
          ← Platform
        </Link>
      }
    >
      <div style={{ ...cardStyle, overflowX: "auto" }}>
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "#94a3b8", textAlign: "left" }}>
            <th style={{ padding: 6 }}>Business</th>
            <th style={{ padding: 6 }}>Customer</th>
            <th style={{ padding: 6 }}>Status</th>
            <th style={{ padding: 6 }}>Pending</th>
            <th style={{ padding: 6 }}>Start</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.bookingId} style={{ borderTop: "1px solid #334155" }}>
              <td style={{ padding: 6 }}>{r.businessName}</td>
              <td style={{ padding: 6 }}>{r.customerName ?? "—"}</td>
              <td style={{ padding: 6 }}>{r.status}</td>
              <td style={{ padding: 6 }}>{r.pendingReason ?? "—"}</td>
              <td style={{ padding: 6 }}>{new Date(r.startAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </InternalPage>
  );
}
