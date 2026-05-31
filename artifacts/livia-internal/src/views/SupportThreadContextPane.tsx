import {
  canonicalSurfaceId,
  getLivToolsForSurface,
  getPlatformSurface,
  getSupportPoint,
} from "@workspace/policy";
import { buttonStyle } from "../styles/ops-ui";
import type { InternalSupportBundle, InternalTenantDetail } from "../lib/api";
import type { LivIncidentBundle, SupportPointRow } from "../lib/api";

type Props = {
  surfaceId?: string;
  supportPoints: SupportPointRow[];
  detail: {
    businessId: string;
    businessSlug: string;
    createdAt: string;
    updatedAt: string;
    description: string;
    internalNotes: Array<{ at: string; by: string; body: string }>;
    triage?: { priority: string; suggestedReply?: string };
  } | null;
  tenantPreview: InternalTenantDetail | null;
  bundle: InternalSupportBundle | null;
  livBundle: LivIncidentBundle | null;
  timelineEvents: Array<{ at: string; label: string; body?: string }>;
  onOpenKnowledgeDoc?: (docPath: string) => void;
};

function resolvePoint(
  surfaceId: string | undefined,
  catalog: SupportPointRow[],
): SupportPointRow | undefined {
  if (!surfaceId) return undefined;
  const canonical = canonicalSurfaceId(surfaceId);
  const fromPolicy = getSupportPoint(canonical);
  if (fromPolicy) return fromPolicy as SupportPointRow;
  return catalog.find((p) => p.surfaceId === canonical);
}

export function SupportThreadContextPane({
  surfaceId,
  supportPoints,
  detail,
  tenantPreview,
  bundle,
  livBundle,
  timelineEvents,
  onOpenKnowledgeDoc,
}: Props) {
  const supportPoint = resolvePoint(surfaceId, supportPoints);
  const platformSurface = surfaceId ? getPlatformSurface(surfaceId) : undefined;
  const livTools = surfaceId ? getLivToolsForSurface(canonicalSurfaceId(surfaceId)) : [];

  return (
    <section
      data-testid="support-context-column"
      style={{
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 14,
        background: "#0f172a",
        minHeight: 400,
      }}
      aria-label="Tenant context and timeline"
    >
      <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#fbbf24" }}>Thread context</h3>

      {supportPoint ? (
        <div
          style={{
            fontSize: 12,
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: "#1e293b",
            lineHeight: 1.45,
          }}
          data-testid="support-context-registry"
        >
          <strong style={{ color: "#e2e8f0" }}>{supportPoint.label}</strong>
          <p style={{ margin: "6px 0 0", color: "#64748b" }}>
            <code>{supportPoint.surfaceId}</code>
            {platformSurface ? (
              <>
                {" "}
                · <code>{platformSurface.screenCardId}</code>
              </>
            ) : null}
            {" · "}
            owner {supportPoint.owner}
          </p>
          {supportPoint.suggestedReply ? (
            <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>{supportPoint.suggestedReply}</p>
          ) : null}
          {livTools.length > 0 ? (
            <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 11 }}>
              Liv tools:{" "}
              {livTools.map((t) => (
                <code key={t.toolId} style={{ marginRight: 6 }}>
                  {t.toolId}
                </code>
              ))}
            </p>
          ) : null}
          {supportPoint.runbook && onOpenKnowledgeDoc ? (
            <button
              type="button"
              style={{ ...buttonStyle, fontSize: 11, padding: "4px 10px", marginTop: 8, background: "#334155" }}
              onClick={() => onOpenKnowledgeDoc(supportPoint.runbook!)}
            >
              Open runbook
            </button>
          ) : null}
        </div>
      ) : surfaceId ? (
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }} data-testid="support-context-missing">
          surfaceId <code>{surfaceId}</code> — not in registry yet.
        </p>
      ) : null}

      {tenantPreview ? (
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>
          <strong style={{ color: "#e2e8f0" }}>{tenantPreview.name ?? "Tenant"}</strong>
          <p style={{ margin: "6px 0 0" }}>
            AI {tenantPreview.aiEnabled ? "on" : "off"} · {tenantPreview.bookingCount} bookings · last
            booking {tenantPreview.lastBookingAt ?? "—"}
          </p>
          {bundle?.suggestedReplySnippets?.[0] ? (
            <p style={{ marginTop: 6, color: "#94a3b8" }}>Snippet: {bundle.suggestedReplySnippets[0]}</p>
          ) : null}
        </div>
      ) : (
        <p style={{ color: "#64748b", fontSize: 12, marginBottom: 12 }}>Select a ticket for tenant health.</p>
      )}

      <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#94a3b8" }}>Timeline & identifiers</h4>
      {!detail ? (
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Select a ticket to see the unified trace.</p>
      ) : (
        <>
          <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 12, lineHeight: 1.5 }}>
            <div>
              <strong>businessId</strong> <code style={{ fontSize: 11 }}>{detail.businessId}</code>
            </div>
            <div>
              <strong>slug</strong> <code style={{ fontSize: 11 }}>{detail.businessSlug}</code>
            </div>
            {livBundle?.requestId ? (
              <div>
                <strong>requestId</strong> <code style={{ fontSize: 11 }}>{livBundle.requestId}</code>
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
  );
}
