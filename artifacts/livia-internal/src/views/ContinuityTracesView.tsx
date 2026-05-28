import { useEffect, useState } from "react";

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

  if (err) return <p style={{ color: "#f87171" }}>{err}</p>;

  return (
    <div>
      <h2 style={{ fontSize: 16, margin: "0 0 12px", color: "#e2e8f0" }}>
        Booking continuity traces ({rows.length})
      </h2>
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
  );
}
