import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listSupportTickets, type SupportTicketRow } from "../lib/api";
import { buttonStyle, cardStyle } from "../styles/ops-ui";

const LANES: Array<{ key: string; label: string; statuses: string[] }> = [
  { key: "open", label: "Open", statuses: ["open"] },
  { key: "triaged", label: "Triaged", statuses: ["triaged"] },
  { key: "resolved", label: "Resolved", statuses: ["resolved"] },
  { key: "closed", label: "Closed", statuses: ["closed"] },
];

function laneForStatus(status: string) {
  return LANES.find((l) => l.statuses.includes(status))?.key ?? "open";
}

function ticketPriority(t: SupportTicketRow): string {
  const triage = t.triage ?? (t.context?.triage as { priority?: string } | undefined);
  return triage?.priority ?? "normal";
}

export function SupportBoardView() {
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await listSupportTickets({ status: "all" });
      setTickets(res.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byLane = useMemo(() => {
    const map = new Map<string, SupportTicketRow[]>();
    for (const lane of LANES) map.set(lane.key, []);
    for (const t of tickets) {
      const lane = laneForStatus(t.status);
      map.get(lane)?.push(t);
    }
    return map;
  }, [tickets]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
          Kanban by status — open a card to work it in the inbox.
        </p>
        <button type="button" style={buttonStyle} onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>
      {err ? <p style={{ color: "#f87171", fontSize: 13 }}>{err}</p> : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          alignItems: "start",
        }}
        data-testid="support-board"
      >
        {LANES.map((lane) => (
          <section key={lane.key} style={{ ...cardStyle, minHeight: 160 }}>
            <h2 style={{ fontSize: 13, margin: "0 0 8px", color: "#94a3b8" }}>
              {lane.label} ({byLane.get(lane.key)?.length ?? 0})
            </h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {(byLane.get(lane.key) ?? []).slice(0, 20).map((t) => (
                <li
                  key={t.id}
                  style={{
                    background: "rgba(30, 41, 59, 0.8)",
                    borderRadius: 8,
                    padding: 8,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: priorityColor(ticketPriority(t)) }}>{ticketPriority(t)}</span>
                    <span style={{ color: "#64748b" }}>{t.category}</span>
                  </div>
                  <p style={{ margin: "6px 0", color: "#e2e8f0", lineHeight: 1.4 }}>
                    {t.description.slice(0, 120)}
                    {t.description.length > 120 ? "…" : ""}
                  </p>
                  <Link to={`/support/${encodeURIComponent(t.id)}`} style={{ color: "#38bdf8", fontSize: 11 }}>
                    Open in inbox →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function priorityColor(p: string) {
  if (p === "urgent") return "#f87171";
  if (p === "low") return "#64748b";
  return "#fbbf24";
}
