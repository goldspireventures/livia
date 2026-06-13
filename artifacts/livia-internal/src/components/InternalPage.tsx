import type React from "react";
import { LAYOUT } from "../styles/ops-ui";
import { OPS_MUTED } from "../styles/platform-ops-tokens";

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
};

/** Consistent page chrome — title row + breathing room for workspace content. */
export function InternalPage({ title, subtitle, actions, children, wide }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: LAYOUT.sectionGap,
        width: "100%",
        maxWidth: wide ? "none" : LAYOUT.contentMaxWidth,
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em" }}>
            {title}
          </h1>
          {subtitle ? (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: OPS_MUTED, lineHeight: 1.5, maxWidth: 720 }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
