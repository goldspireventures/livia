/** v2 Block I — locale voice cast registry (ops; full tooling lands incrementally). */

import { Link } from "react-router-dom";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";
import { InternalPage } from "../components/InternalPage";
import { cardStyle } from "../styles/ops-ui";

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
    <InternalPage
      title={INTERNAL_PAGES.voice.title}
      subtitle={INTERNAL_PAGES.voice.purpose}
      actions={
        <Link to="/platform" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}>
          ← Platform
        </Link>
      }
    >
      <div style={{ ...cardStyle, maxWidth: 720, overflowX: "auto" }}>
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
    </InternalPage>
  );
}
