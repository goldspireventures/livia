import type React from "react";
import {
  OPS_AMBER,
  OPS_BG,
  OPS_BORDER,
  OPS_MUTED,
  OPS_SURFACE,
  OPS_TEXT,
} from "./platform-ops-tokens";

export const LAYOUT = {
  sidebarWidth: 240,
  contentMaxWidth: 1680,
  pagePadding: 24,
  sectionGap: 20,
} as const;

export const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${OPS_BORDER}`,
  background: OPS_BG,
  color: OPS_TEXT,
  fontSize: 14,
};

export const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  maxWidth: "100%",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: OPS_AMBER,
  color: OPS_BG,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
  whiteSpace: "nowrap",
};

export const ghostButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: OPS_SURFACE,
  color: OPS_TEXT,
  border: `1px solid ${OPS_BORDER}`,
  whiteSpace: "normal",
};

/** Selectable sidebar/list row — not a primary action button. */
export const listRowStyle = (active: boolean): React.CSSProperties => ({
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  textAlign: "left",
  padding: "10px 12px",
  marginBottom: 4,
  borderRadius: 8,
  border: `1px solid ${active ? OPS_AMBER : OPS_BORDER}`,
  background: active ? OPS_SURFACE : OPS_BG,
  color: OPS_TEXT,
  cursor: "pointer",
  font: "inherit",
});

/** Compact doc/nav item in a narrow index column. */
export const listNavItemStyle = (active: boolean): React.CSSProperties => ({
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  textAlign: "left",
  padding: "6px 10px",
  marginBottom: 2,
  borderRadius: 6,
  border: "none",
  background: active ? OPS_SURFACE : "transparent",
  color: active ? OPS_TEXT : OPS_MUTED,
  fontSize: 12,
  cursor: "pointer",
  font: "inherit",
});

export const cardStyle: React.CSSProperties = {
  border: `1px solid ${OPS_BORDER}`,
  borderRadius: 12,
  background: OPS_SURFACE,
  padding: 16,
};

export const panelStyle: React.CSSProperties = {
  border: `1px solid ${OPS_BORDER}`,
  borderRadius: 12,
  background: OPS_BG,
  padding: 16,
};

export const subNavLink = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  color: active ? "#38bdf8" : OPS_MUTED,
  background: active ? "rgba(56, 189, 248, 0.12)" : "transparent",
  border: `1px solid ${active ? "rgba(56, 189, 248, 0.35)" : OPS_BORDER}`,
  textDecoration: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  width: "fit-content",
});
