import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ensureDemoReady,
  getLivIncidentBundle,
  getSupportTicket,
  getTenant,
  getSupportBundle,
  listSupportPoints,
  patchSupportTicket,
  listSupportTickets,
  type LivIncidentBundle,
  type SupportPointRow,
  type SupportTicketListFilters,
  type SupportTicketRow,
  getOpsOperator,
  type InternalSupportBundle,
  type InternalTenantDetail,
} from "../lib/api";
import { buttonStyle, cardStyle, inputStyle, listRowStyle, panelStyle } from "../styles/ops-ui";
import { SupportThreadContextPane } from "./SupportThreadContextPane";

type Props = {
  onOpenTenant: (businessId: string) => void;
  onOpenKnowledgeDoc?: (docPath: string) => void;
  selectedTicketId?: string;
  onTicketSelected?: (ticketId: string) => void;
};

const STATUS_OPTIONS = [
  { value: "open,triaged", label: "Active (open + triaged)" },
  { value: "open", label: "Open only" },
  { value: "triaged", label: "Triaged" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All statuses" },
];

const CATEGORY_OPTIONS = ["", "bug", "billing", "liv_error", "feature", "other"];
const PRIORITY_OPTIONS = ["", "urgent", "normal", "low"];

function priorityColor(p: string | undefined) {
  if (p === "urgent") return "#f87171";
  if (p === "low") return "#64748b";
  return "#fbbf24";
}

export function SupportQueueView({
  onOpenTenant,
  onOpenKnowledgeDoc,
  selectedTicketId,
  onTicketSelected,
}: Props) {
  const [filters, setFilters] = useState<SupportTicketListFilters>({
    status: "open,triaged",
    category: "",
    priority: "",
    assignedTo: "",
    q: "",
  });
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportTicketRow | null>(null);
  const [livBundle, setLivBundle] = useState<LivIncidentBundle | null>(null);
  const [tenantPreview, setTenantPreview] = useState<InternalTenantDetail | null>(null);
  const [bundle, setBundle] = useState<InternalSupportBundle | null>(null);
  const [note, setNote] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [supportPoints, setSupportPoints] = useState<SupportPointRow[]>([]);

  useEffect(() => {
    void listSupportPoints()
      .then((r) => setSupportPoints(r.data))
      .catch(() => undefined);
  }, []);

  const loadQueue = useCallback(async () => {
    setErr(null);
    setQueueLoading(true);
    try {
      const res = await listSupportTickets({
        status: filters.status || "open,triaged",
        category: filters.category || undefined,
        priority: filters.priority || undefined,
        assignedTo: filters.assignedTo || undefined,
        q: filters.q || undefined,
      });
      setTickets(res.data);
      setTotal(res.total);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load queue");
      setTickets([]);
      setTotal(0);
    } finally {
      setQueueLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadQueue(), 200);
    return () => window.clearTimeout(t);
  }, [loadQueue]);

  const sorted = useMemo(() => {
    const rank = (p: string | undefined) => (p === "urgent" ? 0 : p === "normal" ? 1 : 2);
    return [...tickets].sort(
      (a, b) =>
        rank(a.triage?.priority) - rank(b.triage?.priority) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [tickets]);

  const selectTicket = useCallback(async (id: string) => {
    setSelectedId(id);
    setBusy(true);
    setErr(null);
    try {
      const t = await getSupportTicket(id);
      setDetail(t);
      setAssignTo(t.assignedTo ?? getOpsOperator());
      const [liv, tenant, ctx] = await Promise.all([
        t.category === "liv_error" || t.triage?.tags?.includes("liv")
          ? getLivIncidentBundle(id).catch(() => null)
          : Promise.resolve(null),
        getTenant(t.businessId).catch(() => null),
        getSupportBundle(t.businessId).catch(() => null),
      ]);
      setLivBundle(liv);
      setTenantPreview(tenant);
      setBundle(ctx);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load ticket");
      setDetail(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedTicketId) return;
    if (selectedTicketId === selectedId) return;
    void selectTicket(selectedTicketId);
  }, [selectedTicketId, selectedId, selectTicket]);

  async function applyPatch(patch: Parameters<typeof patchSupportTicket>[1]) {
    if (!selectedId) return;
    setBusy(true);
    setErr(null);
    try {
      const updated = await patchSupportTicket(selectedId, patch);
      setDetail(updated);
      setNote("");
      await loadQueue();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const timelineEvents = useMemo(() => {
    if (!detail) return [];
    const events: Array<{ at: string; label: string; body?: string }> = [];
    events.push({ at: detail.createdAt, label: "Opened", body: detail.description });
    if (detail.triage) {
      events.push({
        at: detail.updatedAt,
        label: `Triaged (${detail.triage.priority})`,
        body: detail.triage.suggestedReply,
      });
    }
    for (const n of detail.internalNotes) {
      events.push({ at: n.at, label: `Note · ${n.by}`, body: n.body });
    }
    for (const m of livBundle?.recentMessages ?? []) {
      events.push({ at: detail.updatedAt, label: `Message · ${m.role}`, body: m.content });
    }
    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [detail, livBundle]);

  const surfaceId = detail
    ? ((detail.context?.surfaceId as string | undefined) ??
        (detail.context?.surface as string | undefined))
    : undefined;

  const showEmptyInbox = !queueLoading && sorted.length === 0 && !detail;

  async function seedDemoQueue() {
    setSeedingDemo(true);
    setSeedMsg(null);
    setErr(null);
    try {
      const r = await ensureDemoReady();
      setSeedMsg(r.actions.join(" · "));
      await loadQueue();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Demo seed failed");
    } finally {
      setSeedingDemo(false);
    }
  }

  return (
    <div data-testid="support-cockpit" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          ...panelStyle,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
        }}
        data-testid="support-queue-toolbar"
      >
        <span style={{ fontSize: 13, fontWeight: 600, marginRight: 4 }}>Queue</span>
        <select
          value={filters.status ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          style={{ ...inputStyle, width: "auto", minWidth: 140 }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={filters.surfaceId ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, surfaceId: e.target.value }))}
          style={{ ...inputStyle, width: "auto", minWidth: 160 }}
          aria-label="Filter by surface"
          data-testid="support-filter-surface"
        >
          <option value="">All surfaces</option>
          {[...new Set(supportPoints.map((p) => p.surfaceId))].sort().map((sid) => (
            <option key={sid} value={sid}>
              {sid}
            </option>
          ))}
        </select>
        <select
          value={filters.category ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          style={{ ...inputStyle, width: "auto" }}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.filter(Boolean).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filters.priority ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          style={{ ...inputStyle, width: "auto" }}
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.filter(Boolean).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={filters.assignedTo ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, assignedTo: e.target.value }))}
          style={{ ...inputStyle, width: "auto" }}
          aria-label="Filter by assignee"
        >
          <option value="">Any assignee</option>
          <option value="unassigned">Unassigned</option>
          <option value={getOpsOperator()}>Assigned to me</option>
        </select>
        <input
          type="search"
          placeholder="Search description…"
          value={filters.q ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          style={{ ...inputStyle, flex: 1, minWidth: 160 }}
        />
        <span style={{ fontSize: 12, color: "#64748b", marginLeft: "auto" }}>
          {total} ticket{total === 1 ? "" : "s"}
        </span>
      </div>

      {err ? <p style={{ color: "#f87171", fontSize: 13, margin: 0 }} role="alert">{err}</p> : null}

      {queueLoading ? (
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Loading inbox…</p>
      ) : showEmptyInbox ? (
        <SupportInboxEmpty
          filterStatus={filters.status ?? "open,triaged"}
          seedMsg={seedMsg}
          seedingDemo={seedingDemo}
          onShowAll={() => setFilters((f) => ({ ...f, status: "all" }))}
          onSeedDemo={() => void seedDemoQueue()}
        />
      ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 300px) minmax(480px, 1fr) minmax(300px, 360px)",
          gap: 16,
          alignItems: "stretch",
          minHeight: "calc(100vh - 280px)",
        }}
      >
      <section data-testid="support-queue-column" style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, overflow: "auto" }}>
          {sorted.map((t) => {
            const active = t.id === selectedId;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    onTicketSelected?.(t.id);
                    void selectTicket(t.id);
                  }}
                  style={listRowStyle(active)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>
                      {t.category} · {t.businessName}
                    </strong>
                    <span style={{ fontSize: 11, color: priorityColor(t.triage?.priority) }}>
                      {t.triage?.priority ?? "normal"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {t.status}
                    {t.assignedTo ? ` · ${t.assignedTo}` : " · unassigned"} · {t.businessSlug}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#cbd5e1",
                      marginTop: 6,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.description}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        {sorted.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            No tickets match filters.{" "}
            <a href="/support/radar" style={{ color: "#38bdf8" }}>
              Open radar →
            </a>
          </p>
        ) : null}
      </section>

      <section
        data-testid="support-thread-column"
        style={{
          ...panelStyle,
          background: "#1e293b",
          minWidth: 0,
          overflow: "auto",
        }}
      >
        {!detail ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 280,
              textAlign: "center",
              padding: 24,
              color: "#94a3b8",
            }}
          >
            <p style={{ margin: 0, fontSize: 15, color: "#cbd5e1" }}>Select a ticket</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>
              Pick a thread from the queue to triage, assign, and view tenant context.
            </p>
          </div>
        ) : (
          <>
            {detail.triage?.priority === "urgent" ? (
              <div
                data-testid="support-p0-banner"
                style={{
                  marginBottom: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(248, 113, 113, 0.12)",
                  border: "1px solid rgba(248, 113, 113, 0.45)",
                  fontSize: 12,
                  color: "#fecaca",
                }}
              >
                P0 urgent — respond within SLA. Oldest open tickets surface in Founder cockpit.
              </div>
            ) : null}
            <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>{detail.businessName}</h3>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              {detail.id} · {detail.status} · reporter {detail.reporterEmail ?? detail.userId}
            </p>

            <p style={{ margin: "12px 0", fontSize: 14, lineHeight: 1.5, color: "#e2e8f0" }}>
              {detail.description}
            </p>

            {detail.triage ? (
              <div
                style={{
                  fontSize: 12,
                  padding: 10,
                  borderRadius: 8,
                  background: "#0f172a",
                  marginBottom: 12,
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: "#fbbf24" }}>Auto-triage</strong> ({detail.triage.priority}) — tags:{" "}
                {detail.triage.tags.join(", ")}
                <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>{detail.triage.suggestedReply}</p>
              </div>
            ) : null}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <button type="button" style={buttonStyle} disabled={busy} onClick={() => void applyPatch({ status: "triaged", assignedTo: assignTo || getOpsOperator() })}>
                Mark triaged
              </button>
              <button type="button" style={buttonStyle} disabled={busy} onClick={() => void applyPatch({ status: "resolved" })}>
                Resolve
              </button>
              <button type="button" style={{ ...buttonStyle, background: "#334155" }} disabled={busy} onClick={() => void applyPatch({ reTriage: true })}>
                Re-run triage
              </button>
              <button
                type="button"
                style={{ ...buttonStyle, background: "#334155" }}
                onClick={() => onOpenTenant(detail.businessId)}
              >
                Open tenant
              </button>
            </div>

            <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Assign to (email)
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="you@livia.io"
              />
              <button
                type="button"
                style={buttonStyle}
                disabled={busy}
                onClick={() => void applyPatch({ assignedTo: assignTo.trim() || null })}
              >
                Save assignee
              </button>
            </div>

            <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Internal note
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: "vertical", width: "100%" }}
                placeholder="Investigation notes (audited)…"
              />
              <button
                type="button"
                style={buttonStyle}
                disabled={busy || !note.trim()}
                onClick={() => void applyPatch({ note })}
              >
                Add note
              </button>
            </div>

            {detail.internalNotes.length > 0 ? (
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 12, color: "#fbbf24", margin: "0 0 6px" }}>Notes</h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#cbd5e1" }}>
                  {detail.internalNotes.map((n, i) => (
                    <li key={`${n.at}-${i}`} style={{ marginBottom: 6 }}>
                      <span style={{ color: "#64748b" }}>
                        {n.by} · {new Date(n.at).toLocaleString()}
                      </span>
                      <br />
                      {n.body}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(detail.category === "liv_error" || detail.triage?.tags?.includes("liv")) && livBundle ? (
              <div style={{ borderTop: "1px solid #334155", paddingTop: 12, marginTop: 8 }}>
                <h4 style={{ fontSize: 13, color: "#fbbf24", margin: "0 0 8px" }}>Liv incident bundle</h4>
                {livBundle.requestId ? (
                  <p style={{ fontSize: 12, color: "#94a3b8" }}>
                    requestId: <code>{livBundle.requestId}</code>
                    {livBundle.trace?.sentrySearchUrl ? (
                      <>
                        {" "}
                        ·{" "}
                        <a href={livBundle.trace.sentrySearchUrl} target="_blank" rel="noreferrer">
                          Sentry
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}
                {livBundle.conversation ? (
                  <p style={{ fontSize: 12, color: "#94a3b8" }}>
                    Conversation {livBundle.conversation.id} ({livBundle.conversation.channel},{" "}
                    {livBundle.conversation.status})
                  </p>
                ) : null}
                {livBundle.recentMessages.length > 0 ? (
                  <ul style={{ fontSize: 11, color: "#cbd5e1", paddingLeft: 16, maxHeight: 160, overflow: "auto" }}>
                    {livBundle.recentMessages.map((m, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        <strong>{m.role}</strong> · {m.content.slice(0, 280)}
                        {m.content.length > 280 ? "…" : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ul style={{ fontSize: 12, color: "#94a3b8", paddingLeft: 16, marginTop: 8 }}>
                  {livBundle.suggestedActions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

          </>
        )}
      </section>

      <SupportThreadContextPane
        surfaceId={surfaceId}
        supportPoints={supportPoints}
        detail={detail}
        tenantPreview={tenantPreview}
        bundle={bundle}
        livBundle={livBundle}
        timelineEvents={timelineEvents}
        onOpenKnowledgeDoc={onOpenKnowledgeDoc}
        onOpenTenant={onOpenTenant}
      />
      </div>
      )}
    </div>
  );
}

function SupportInboxEmpty({
  filterStatus,
  onShowAll,
  onSeedDemo,
  seedingDemo,
  seedMsg,
}: {
  filterStatus: string;
  onShowAll: () => void;
  onSeedDemo: () => void;
  seedingDemo: boolean;
  seedMsg: string | null;
}) {
  const filtered = filterStatus !== "all";

  return (
    <div
      style={{
        ...cardStyle,
        padding: 28,
        maxWidth: 520,
        margin: "32px auto",
        textAlign: "left",
      }}
      data-testid="support-inbox-empty"
    >
      <h2 style={{ margin: "0 0 8px", fontSize: 18, color: "#e2e8f0" }}>Inbox is empty</h2>
      <p style={{ margin: "0 0 16px", fontSize: 14, color: "#94a3b8", lineHeight: 1.55 }}>
        {filtered
          ? "No tickets match the current filters. On a fresh local stack this is normal until demo data is seeded."
          : "No support tickets in the database yet. Seed the demo world to populate the queue for triage practice."}
      </p>
      <ul style={{ margin: "0 0 20px", paddingLeft: 20, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
        <li>Run <code>pnpm demo:provision</code> once if the demo world is not set up</li>
        <li>Or use <strong>Seed demo queue</strong> below (dev) to add open tickets</li>
        <li>Check <Link to="/support/radar">Radar</Link> for proactive tenant signals</li>
      </ul>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {filtered ? (
          <button type="button" style={buttonStyle} onClick={onShowAll}>
            Show all tickets
          </button>
        ) : null}
        <Link to="/support/radar" style={{ ...buttonStyle, background: "#334155", color: "#e2e8f0", textDecoration: "none" }}>
          Open radar
        </Link>
        {import.meta.env.DEV ? (
          <button type="button" style={buttonStyle} onClick={onSeedDemo} disabled={seedingDemo}>
            {seedingDemo ? "Seeding…" : "Seed demo queue"}
          </button>
        ) : null}
      </div>
      {seedMsg ? (
        <p style={{ margin: "14px 0 0", fontSize: 12, color: "#a5f3fc", lineHeight: 1.5 }}>{seedMsg}</p>
      ) : null}
    </div>
  );
}
