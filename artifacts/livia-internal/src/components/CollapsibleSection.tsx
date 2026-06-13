import type React from "react";
import { cardStyle } from "../styles/ops-ui";
import { OPS_MUTED, OPS_TEXT } from "../styles/platform-ops-tokens";

type Props = {
  title: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

/** Tuck secondary content behind a clear expand control. */
export function CollapsibleSection({ title, summary, children, defaultOpen = false }: Props) {
  return (
    <details style={{ ...cardStyle, padding: 0 }} open={defaultOpen}>
      <summary
        style={{
          cursor: "pointer",
          padding: "14px 16px",
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: OPS_TEXT }}>{title}</span>
        {summary ? (
          <span style={{ fontSize: 12, color: OPS_MUTED, lineHeight: 1.45, fontWeight: 400 }}>{summary}</span>
        ) : null}
      </summary>
      <div style={{ padding: "0 16px 16px", display: "grid", gap: 12 }}>{children}</div>
    </details>
  );
}
