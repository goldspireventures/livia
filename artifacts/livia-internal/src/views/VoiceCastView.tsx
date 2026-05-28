/** v2 Block I — locale voice cast registry (ops; full tooling lands incrementally). */

const LOCALES = [
  { id: "en-IE", label: "English (Ireland)", voice: "production", cast: "Liv IE" },
  { id: "en-GB", label: "English (UK)", voice: "gated", cast: "UK_VOICE_ENABLED" },
  { id: "sv-SE", label: "Swedish", voice: "text v2", cast: "TBD" },
  { id: "da-DK", label: "Danish", voice: "text v2", cast: "TBD" },
  { id: "nb-NO", label: "Norwegian", voice: "text v2", cast: "TBD" },
  { id: "fi-FI", label: "Finnish", voice: "text only", cast: "TBD" },
];

export function VoiceCastView() {
  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 16, margin: "0 0 12px", color: "#e2e8f0" }}>Locale & voice cast</h2>
      <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, marginBottom: 16 }}>
        Per ADR 0016 — each locale needs a character lead, golden corpus, and eval pass before voice
        ships. Edit prompts in tenant Settings until per-locale internal editor ships.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", textAlign: "left" }}>
            <th style={{ padding: "8px 10px" }}>Locale</th>
            <th style={{ padding: "8px 10px" }}>Voice</th>
            <th style={{ padding: "8px 10px" }}>Cast / gate</th>
          </tr>
        </thead>
        <tbody>
          {LOCALES.map((l) => (
            <tr key={l.id} style={{ borderBottom: "1px solid #1e293b" }}>
              <td style={{ padding: "10px", color: "#e2e8f0" }}>{l.label}</td>
              <td style={{ padding: "10px", color: "#cbd5e1" }}>{l.voice}</td>
              <td style={{ padding: "10px", color: "#94a3b8" }}>
                <code>{l.cast}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
