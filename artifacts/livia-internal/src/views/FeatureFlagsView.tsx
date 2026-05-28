import React, { useCallback, useEffect, useState } from "react";
import { buttonStyle, inputStyle } from "../styles/ops-ui";

type FlagRow = {
  id: string;
  key: string;
  businessId: string | null;
  isEnabled: boolean;
  description: string | null;
  businessName: string | null;
  businessSlug: string | null;
};

export function FeatureFlagsView() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [knownKeys, setKnownKeys] = useState<string[]>([]);
  const [bizQ, setBizQ] = useState("");
  const [bizHits, setBizHits] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const secret = window.sessionStorage.getItem("livia.internal.opsSecret") ?? "";
    const params = new URLSearchParams();
    if (selectedBiz) params.set("businessId", selectedBiz);
    const res = await fetch(`/api/internal/ops/feature-flags?${params}`, {
      headers: { "X-Internal-Ops-Secret": secret },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Load failed");
    setFlags(data.flags ?? []);
    setKnownKeys(data.knownKeys ?? []);
  }, [selectedBiz]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: FlagRow) => {
    const secret = window.sessionStorage.getItem("livia.internal.opsSecret") ?? "";
    const operator = window.sessionStorage.getItem("livia.internal.opsOperator") ?? "";
    const role = window.sessionStorage.getItem("livia.internal.opsRole") ?? "engineer";
    await fetch("/api/internal/ops/feature-flags", {
      method: "PATCH",
      headers: {
        "X-Internal-Ops-Secret": secret,
        "X-Internal-Ops-Operator": operator,
        "X-Internal-Ops-Role": role,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: row.key,
        businessId: row.businessId,
        isEnabled: !row.isEnabled,
      }),
    });
    void load();
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!bizQ.trim()) {
        setBizHits([]);
        return;
      }
      const secret = window.sessionStorage.getItem("livia.internal.opsSecret") ?? "";
      void fetch(`/api/internal/ops/feature-flags/business-search?q=${encodeURIComponent(bizQ)}`, {
        headers: { "X-Internal-Ops-Secret": secret },
      })
        .then((r) => r.json())
        .then((d) => setBizHits(d.data ?? []))
        .catch(() => setBizHits([]));
    }, 280);
    return () => window.clearTimeout(t);
  }, [bizQ]);

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Feature flags</h2>
      <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
        Tenant and global toggles — known keys: {knownKeys.join(", ")}
      </p>
      {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={bizQ}
          onChange={(e) => setBizQ(e.target.value)}
          placeholder="Filter by tenant…"
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <button type="button" style={buttonStyle} onClick={() => setSelectedBiz(null)}>
          All tenants
        </button>
      </div>
      {bizHits.length > 0 ? (
        <ul style={{ margin: "0 0 12px", padding: 0, listStyle: "none" }}>
          {bizHits.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                style={{ ...buttonStyle, width: "100%", textAlign: "left", marginBottom: 4 }}
                onClick={() => {
                  setSelectedBiz(b.id);
                  setBizQ(b.name);
                  setBizHits([]);
                }}
              >
                {b.name} · {b.slug}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "#94a3b8", textAlign: "left" }}>
            <th>Key</th>
            <th>Tenant</th>
            <th>On</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((f) => (
            <tr key={f.id} style={{ borderTop: "1px solid #334155" }}>
              <td style={{ padding: "8px 4px" }}>{f.key}</td>
              <td style={{ padding: "8px 4px" }}>{f.businessSlug ?? "global"}</td>
              <td style={{ padding: "8px 4px" }}>
                <button type="button" style={buttonStyle} onClick={() => void toggle(f)}>
                  {f.isEnabled ? "Yes" : "No"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
