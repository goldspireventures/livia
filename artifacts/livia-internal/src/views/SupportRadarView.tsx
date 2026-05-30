import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SupportSurfaceNav } from "../components/SupportSurfaceNav";
import { listSupportTickets, type SupportTicketRow } from "../lib/api";
import { buttonStyle } from "../styles/ops-ui";

type RadarMetric = { label: string; value: number; tone: "ok" | "warn" | "urgent" };

function ticketPriority(t: SupportTicketRow): string {
  const triage = t.triage ?? (t.context?.triage as { priority?: string } | undefined);
  return triage?.priority ?? "normal";
}

export function SupportRadarView() {
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await listSupportTickets({ status: "open,triaged" });
      setTickets(res.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load radar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo((): RadarMetric[] => {
    const urgent = tickets.filter((t) => ticketPriority(t) === "urgent").length;
    const billing = tickets.filter((t) => t.category === "billing").length;
    const liv = tickets.filter((t) => t.category === "liv_error").length;
    const open = tickets.filter((t) => t.status === "open").length;
    return [
      { label: "Active tickets", value: tickets.length, tone: tickets.length > 10 ? "warn" : "ok" },
      { label: "Urgent priority", value: urgent, tone: urgent > 0 ? "urgent" : "ok" },
      { label: "Open (untriaged)", value: open, tone: open > 5 ? "warn" : "ok" },
      { label: "Billing", value: billing, tone: billing > 0 ? "warn" : "ok" },
      { label: "Liv errors", value: liv, tone: liv > 0 ? "urgent" : "ok" },
    ];
  }, [tickets]);

  const hot = useMemo(
    () =>
      [...tickets]
        .filter((t) => ticketPriority(t) === "urgent" || t.category === "liv_error")
        .slice(0, 8),
    [tickets],
  );

  return (
    <div>
      <SupportSurfaceNav />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>Radar</h1>
        <button type="button" style={buttonStyle} onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>
      {err ? <p style={{ color: "#f87171", fontSize: 13 }}>{err}</p> : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10,
          marginBottom: 16,
        }}
        data-testid="support-radar"
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: 10,
              padding: 12,
              background:
                m.tone === "urgent"
                  ? "rgba(127, 29, 29, 0.25)"
                  : m.tone === "warn"
                    ? "rgba(120, 53, 15, 0.2)"
                    : "rgba(15, 23, 42, 0.5)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 600, color: "#e2e8f0" }}>{m.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 8px" }}>Needs attention</h2>
      {hot.length === 0 ? (
        <p style={{ fontSize: 13, color: "#64748b" }}>No urgent or Liv tickets in the active queue.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {hot.map((t) => (
            <li
              key={t.id}
              style={{
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 8,
                padding: 10,
                fontSize: 12,
              }}
            >
              <strong style={{ color: "#fbbf24" }}>{ticketPriority(t)}</strong>
              <span style={{ color: "#64748b", marginLeft: 8 }}>{t.category}</span>
              <p style={{ margin: "6px 0", color: "#cbd5e1" }}>{t.description.slice(0, 100)}…</p>
              <Link to={`/support?ticket=${t.id}`} style={{ color: "#38bdf8" }}>
                Thread →
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p style={{ fontSize: 11, color: "#64748b", marginTop: 16 }}>
        Proactive tenant health (stuck onboarding, zero bookings) feeds here in R2.
      </p>
    </div>
  );
}
