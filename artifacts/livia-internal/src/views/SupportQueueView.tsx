import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getLivIncidentBundle,
  getSupportTicket,
  getTenant,
  getSupportBundle,
  patchSupportTicket,
  listSupportTickets,
  type LivIncidentBundle,
  type SupportTicketListFilters,
  type SupportTicketRow,
  getOpsOperator,
  type InternalSupportBundle,
  type InternalTenantDetail,
} from "../lib/api";
import { buttonStyle, inputStyle } from "../styles/ops-ui";

const SUPPORT_RUNBOOKS = [
  { label: "Support runbook", path: "operations/support-runbook.md" },
  { label: "Operating model (SLA)", path: "operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md" },
  { label: "Support lifecycle", path: "operations/INTERNAL-SUPPORT-LIFECYCLE.md" },
] as const;

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

  const loadQueue = useCallback(async () => {
    setErr(null);
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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(240px, 0.9fr) minmax(320px, 1.1fr) minmax(260px, 0.85fr)",
        gap: 16,
        alignItems: "start",
      }}
      data-testid="support-cockpit"
    >
      <section>
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Support queue</h2>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.45 }}>
          Queue · summary · timeline. Open a runbook in Knowledge:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {SUPPORT_RUNBOOKS.map((doc) =>
            onOpenKnowledgeDoc ? (
              <button
                key={doc.path}
                type="button"
                style={{ ...buttonStyle, fontSize: 11, padding: "4px 10px", background: "#334155" }}
                onClick={() => onOpenKnowledgeDoc(doc.path)}
              >
                {doc.label}
              </button>
            ) : (
              <span key={doc.path} style={{ fontSize: 11, color: "#94a3b8" }}>
                {doc.label}
              </span>
            ),
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
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
            style={{ ...inputStyle, flex: 1, minWidth: 120 }}
          />
        </div>

        {err ? <p style={{ color: "#f87171", fontSize: 13 }}>{err}</p> : null}
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px" }}>
          {total} ticket{total === 1 ? "" : "s"}
        </p>

        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: "min(70vh, 640px)", overflow: "auto" }}>
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
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 10px",
                    marginBottom: 4,
                    borderRadius: 8,
                    border: active ? "1px solid #f59e0b" : "1px solid #334155",
                    background: active ? "#1e293b" : "#0f172a",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
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
          <p style={{ color: "#94a3b8", fontSize: 13 }}>No tickets match filters.</p>
        ) : null}
      </section>

      <section
        style={{
          border: "1px solid #334155",
          borderRadius: 12,
          padding: 16,
          background: "#1e293b",
          minHeight: 400,
        }}
      >
        {!detail ? (
          <p style={{ color: "#94a3b8" }}>Select a ticket from the queue.</p>
        ) : (
          <>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
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

            {tenantPreview ? (
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 12, lineHeight: 1.5 }}>
                AI {tenantPreview.aiEnabled ? "on" : "off"} · {tenantPreview.bookingCount} bookings · last
                booking {tenantPreview.lastBookingAt ?? "—"}
                {bundle?.suggestedReplySnippets?.[0] ? (
                  <p style={{ marginTop: 6, color: "#94a3b8" }}>Snippet: {bundle.suggestedReplySnippets[0]}</p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>

      <section
        style={{
          border: "1px solid #334155",
          borderRadius: 12,
          padding: 14,
          background: "#0f172a",
          minHeight: 400,
        }}
        aria-label="Ticket timeline"
      >
        <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#fbbf24" }}>Timeline & identifiers</h3>
        {!detail ? (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>Select a ticket to see the unified trace.</p>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 12, lineHeight: 1.5 }}>
              <div>
                <strong>businessId</strong>{" "}
                <code style={{ fontSize: 11 }}>{detail.businessId}</code>
              </div>
              <div>
                <strong>slug</strong> <code style={{ fontSize: 11 }}>{detail.businessSlug}</code>
              </div>
              {livBundle?.requestId ? (
                <div>
                  <strong>requestId</strong>{" "}
                  <code style={{ fontSize: 11 }}>{livBundle.requestId}</code>
                </div>
              ) : null}
              {livBundle?.conversation?.id ? (
                <div>
                  <strong>conversationId</strong>{" "}
                  <code style={{ fontSize: 11 }}>{livBundle.conversation.id}</code>
                </div>
              ) : null}
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, maxHeight: "min(55vh, 520px)", overflow: "auto" }}>
              {timelineEvents.map((ev, i) => (
                <li key={`${ev.at}-${i}`} style={{ marginBottom: 10, fontSize: 12, color: "#e2e8f0" }}>
                  <span style={{ color: "#64748b" }}>
                    {new Date(ev.at).toLocaleString("en-IE", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <br />
                  <strong>{ev.label}</strong>
                  {ev.body ? (
                    <p style={{ margin: "4px 0 0", color: "#94a3b8", lineHeight: 1.4 }}>{ev.body}</p>
                  ) : null}
                </li>
              ))}
            </ol>
            {livBundle?.suggestedActions?.length ? (
              <div style={{ marginTop: 12, borderTop: "1px solid #334155", paddingTop: 10 }}>
                <h4 style={{ fontSize: 12, color: "#fbbf24", margin: "0 0 6px" }}>Suggested actions</h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#94a3b8" }}>
                  {livBundle.suggestedActions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
