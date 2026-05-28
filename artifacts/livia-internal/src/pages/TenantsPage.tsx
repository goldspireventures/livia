import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getSupportBundle,
  getTenant,
  searchTenants,
  type InternalSupportBundle,
  type InternalTenantDetail,
  type InternalTenantListItem,
} from "../lib/api";
import { buttonStyle, inputStyle } from "../styles/ops-ui";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TenantsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const routeTenantId = useMemo(() => (params.businessId ? String(params.businessId) : null), [params.businessId]);

  const [query, setQuery] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");
  const [rows, setRows] = useState<InternalTenantListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InternalTenantDetail | null>(null);
  const [supportBundle, setSupportBundle] = useState<InternalSupportBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadList = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchTenants(q);
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [d, bundle] = await Promise.all([getTenant(id), getSupportBundle(id).catch(() => null)]);
      setDetail(d);
      setSupportBundle(bundle);
      setSelectedId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setDetail(null);
      setSupportBundle(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setSubmittedQ(query.trim()), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    void loadList(submittedQ);
  }, [submittedQ, loadList]);

  useEffect(() => {
    if (!routeTenantId) return;
    void loadDetail(routeTenantId);
  }, [routeTenantId, loadDetail]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter as you type — name, slug, email…"
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
          aria-label="Search tenants"
        />
        {loading ? (
          <span style={{ fontSize: 12, color: "#64748b" }}>Searching…</span>
        ) : (
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {total} tenant{total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error ? (
        <p style={{ color: "#f87171", marginBottom: 12 }} role="alert">
          {error}
        </p>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <section>
          <h2 style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 8px" }}>
            {loading ? "Loading…" : `${total} tenant${total === 1 ? "" : "s"}`}
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {rows.map((r) => (
              <li key={r.id} style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => navigate(`/tenants/${encodeURIComponent(r.id)}`)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: selectedId === r.id ? "1px solid #f59e0b" : "1px solid #334155",
                    background: selectedId === r.id ? "#1e293b" : "#0f172a",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {r.slug} · last booking {formatWhen(r.lastBookingAt)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          {detail ? (
            <HealthCard detail={detail} bundle={supportBundle} />
          ) : (
            <p style={{ color: "#64748b" }}>Select a tenant for the health card.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function HealthCard({
  detail,
  bundle,
}: {
  detail: InternalTenantDetail;
  bundle: InternalSupportBundle | null;
}) {
  return (
    <div
      style={{
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 16,
        background: "#1e293b",
      }}
    >
      <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>{detail.name}</h2>
      <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
        {detail.slug} · {detail.id}
      </p>

      <dl style={dlStyle}>
        <Dt>Last booking</Dt>
        <Dd>{formatWhen(detail.lastBookingAt)}</Dd>
        <Dt>Owner</Dt>
        <Dd>
          {detail.ownerEmail ?? "—"}
          <br />
          <span style={{ fontSize: 11, color: "#64748b" }}>{detail.ownerId}</span>
        </Dd>
        <Dt>Plan / billing</Dt>
        <Dd>
          {detail.planId ?? detail.tier} · {detail.stripeSubscriptionStatus ?? "no sub"}
        </Dd>
        <Dt>Voice</Dt>
        <Dd>
          {detail.voiceProvisioned ? detail.twilioPhoneNumber : "not provisioned"}
          {detail.voiceReceptionistEntitled ? " · entitled" : " · not entitled"}
        </Dd>
        <Dt>AI</Dt>
        <Dd>{detail.aiEnabled ? "on" : "off"}</Dd>
        <Dt>Last inbound SMS</Dt>
        <Dd>{formatWhen(detail.lastInboundSmsAt)}</Dd>
        <Dt>Bookings / staff</Dt>
        <Dd>
          {detail.bookingCount} bookings · {detail.activeStaffCount} active staff
        </Dd>
      </dl>

      <h3 style={{ fontSize: 13, color: "#fbbf24", margin: "16px 0 8px" }}>Deep links</h3>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 13 }}>
        {detail.deepLinks.stripeCustomer ? (
          <li>
            <a href={detail.deepLinks.stripeCustomer} target="_blank" rel="noreferrer">
              Stripe customer
            </a>
          </li>
        ) : null}
        {detail.deepLinks.clerkUser ? (
          <li>
            <a href={detail.deepLinks.clerkUser} target="_blank" rel="noreferrer">
              Clerk user (owner)
            </a>
          </li>
        ) : null}
        {detail.deepLinks.tenantDashboard ? (
          <li>
            <a href={detail.deepLinks.tenantDashboard} target="_blank" rel="noreferrer">
              Tenant dashboard
            </a>
          </li>
        ) : null}
        {detail.deepLinks.publicBooking ? (
          <li>
            <a href={detail.deepLinks.publicBooking} target="_blank" rel="noreferrer">
              Public booking page
            </a>
          </li>
        ) : null}
        {detail.deepLinks.sentry ? (
          <li>
            <a href={detail.deepLinks.sentry} target="_blank" rel="noreferrer">
              Sentry (tenant)
            </a>
          </li>
        ) : null}
      </ul>

      {bundle ? (
        <div style={{ marginTop: 14, fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>
          <h3 style={{ fontSize: 13, color: "#fbbf24", margin: "0 0 6px" }}>Support bundle</h3>
          {bundle.suggestedReplySnippets.length > 0 ? (
            <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>
              {bundle.suggestedReplySnippets.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : null}
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "#64748b" }}>
            Operator pack: {bundle.operatorPackSections.join(" · ")}
          </p>
        </div>
      ) : null}

      <p style={{ marginTop: 16, fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
        Livia Inc roles (v1): <strong>Support</strong> read tenants · <strong>Success</strong> billing links ·{" "}
        <strong>Eng</strong> no prod writes without approval. Tenant owners use audited view-as only.
      </p>

      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a
          href={detail.deepLinks.tenantDashboard ?? undefined}
          target="_blank"
          rel="noreferrer"
          style={{ ...buttonStyle, background: "#334155", color: "#e2e8f0", textDecoration: "none" }}
        >
          Open dashboard
        </a>
      </div>
    </div>
  );
}

const dlStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: "8px 12px",
  marginTop: 16,
  fontSize: 13,
};

function Dt({ children }: { children: React.ReactNode }) {
  return <dt style={{ color: "#94a3b8", margin: 0 }}>{children}</dt>;
}

function Dd({ children }: { children: React.ReactNode }) {
  return <dd style={{ margin: 0, color: "#e2e8f0" }}>{children}</dd>;
}

