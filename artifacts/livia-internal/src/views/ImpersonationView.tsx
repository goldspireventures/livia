import React, { useState } from "react";
import { buttonStyle, cardStyle, inputStyle } from "../styles/ops-ui";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";
import { InternalPage } from "../components/InternalPage";

type Intent = {
  ticketId: string;
  businessId: string;
  tenantDashboardUrl: string | null;
  publicBookingUrl: string | null;
  policy: string;
  createdAt: string;
};

export function ImpersonationView({ defaultBusinessId }: { defaultBusinessId?: string }) {
  const [ticketId, setTicketId] = useState("");
  const [businessId, setBusinessId] = useState(defaultBusinessId ?? "");
  const [reason, setReason] = useState("");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [ssoBanner, setSsoBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const secret = window.sessionStorage.getItem("livia.internal.opsSecret") ?? "";
    void fetch("/api/internal/ops/sso-status", { headers: { "X-Internal-Ops-Secret": secret } })
      .then((r) => r.json())
      .then((d) => setSsoBanner(d.banner ?? null))
      .catch(() => null);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const secret = window.sessionStorage.getItem("livia.internal.opsSecret") ?? "";
    const operator = window.sessionStorage.getItem("livia.internal.opsOperator") ?? "";
    const role = window.sessionStorage.getItem("livia.internal.opsRole") ?? "engineer";
    const res = await fetch("/api/internal/ops/impersonation/intent", {
      method: "POST",
      headers: {
        "X-Internal-Ops-Secret": secret,
        "X-Internal-Ops-Operator": operator,
        "X-Internal-Ops-Role": role,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ticketId, businessId, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setIntent(data);
  };

  return (
    <InternalPage
      title={INTERNAL_PAGES.access.title}
      subtitle={INTERNAL_PAGES.access.purpose}
    >
      {ssoBanner ? (
        <p style={{ color: "#fbbf24", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{ssoBanner}</p>
      ) : null}
      <form onSubmit={(e) => void submit(e)} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", width: "100%", maxWidth: 480 }}>
        <input
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          placeholder="Support ticket ID"
          style={{ ...inputStyle, width: "100%" }}
          required
        />
        <input
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          placeholder="Business UUID"
          style={{ ...inputStyle, width: "100%" }}
          required
        />
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (min 8 chars)"
          style={{ ...inputStyle, minHeight: 80, width: "100%" }}
          required
        />
        <button type="submit" style={{ ...buttonStyle, alignSelf: "flex-start" }}>
          Record intent & get links
        </button>
      </form>
      {error ? <p style={{ color: "#f87171", marginTop: 12 }}>{error}</p> : null}
      {intent ? (
        <div style={{ marginTop: 20, padding: 16, background: "#1e293b", borderRadius: 8 }}>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>{intent.policy}</p>
          <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
            {intent.tenantDashboardUrl ? (
              <li>
                <a href={intent.tenantDashboardUrl} target="_blank" rel="noreferrer">
                  Tenant dashboard
                </a>
              </li>
            ) : null}
            {intent.publicBookingUrl ? (
              <li>
                <a href={intent.publicBookingUrl} target="_blank" rel="noreferrer">
                  Public booking
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </InternalPage>
  );
}
