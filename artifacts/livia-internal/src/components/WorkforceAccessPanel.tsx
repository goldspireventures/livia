import { useState } from "react";
import {
  grantWorkforceAccess,
  revokeWorkforceAccess,
  type WorkforceAccessGrant,
} from "../lib/api";

const card: React.CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: 12,
  padding: 16,
  background: "rgba(15, 23, 42, 0.55)",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(56, 189, 248, 0.12)",
  color: "#7dd3fc",
  fontSize: 12,
  cursor: "pointer",
};

const input: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: 13,
  width: "100%",
};

export function WorkforceAccessPanel({
  goldspireDomain,
  grants,
  onChanged,
}: {
  goldspireDomain: string;
  grants: WorkforceAccessGrant[];
  onChanged?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<"restricted" | "full">("full");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await grantWorkforceAccess({ email: email.trim(), tier, notes: notes.trim() || undefined });
      setMsg(`Granted ${email.trim()}`);
      setEmail("");
      setNotes("");
      onChanged?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Grant failed");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (target: string) => {
    if (!window.confirm(`Revoke cockpit access for ${target}?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      await revokeWorkforceAccess(target);
      setMsg(`Revoked ${target}`);
      onChanged?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 8px", fontSize: 16, color: "#e2e8f0" }}>Goldspire workforce access</h2>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>
        <strong>Only place</strong> to grant @goldspireventures.com access (beta signup, internal tier). Domain alone
        grants nothing — add each inbox here.
      </p>

      <form onSubmit={(e) => void submit(e)} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <input
          type="email"
          required
          placeholder={`partner@${goldspireDomain}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as "restricted" | "full")}
            style={{ ...input, width: "auto", minWidth: 140 }}
          >
            <option value="full">Full</option>
            <option value="restricted">Restricted</option>
          </select>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...input, flex: 1, minWidth: 160 }}
          />
          <button type="submit" style={btn} disabled={busy}>
            Grant
          </button>
        </div>
      </form>

      {msg ? <p style={{ fontSize: 12, color: "#cbd5e1", margin: "0 0 12px" }}>{msg}</p> : null}

      {grants.length === 0 ? (
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>No active Goldspire grants.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {grants.map((g) => (
            <li
              key={g.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #334155",
                fontSize: 12,
              }}
            >
              <div>
                <strong style={{ color: "#e2e8f0" }}>{g.email}</strong>
                <span style={{ color: "#64748b", marginLeft: 8 }}>{g.tier}</span>
                {g.notes ? <p style={{ margin: "4px 0 0", color: "#94a3b8" }}>{g.notes}</p> : null}
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  by {g.grantedBy} · {new Date(g.grantedAt).toLocaleString()}
                </p>
              </div>
              <button type="button" style={{ ...btn, background: "#7f1d1d", color: "#fecaca" }} onClick={() => void revoke(g.email)} disabled={busy}>
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
