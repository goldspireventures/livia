import { Link } from "react-router-dom";
import { subNavLink } from "../styles/ops-ui";

export type InternalSubNavItem = {
  id: string;
  label: string;
  hint?: string;
  to?: string;
  badge?: number | string;
};

type Props = {
  items: InternalSubNavItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  secondary?: boolean;
  "aria-label"?: string;
};

/** Workspace tab bar — link mode when `to` is set, button mode otherwise. */
export function InternalSubNav({
  items,
  activeId,
  onSelect,
  secondary,
  "aria-label": ariaLabel = "Section navigation",
}: Props) {
  return (
    <nav
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        paddingBottom: secondary ? 0 : 4,
        borderBottom: secondary ? "none" : "1px solid #334155",
        opacity: secondary ? 0.92 : 1,
      }}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const label = (
          <span style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {item.label}
              {item.badge != null && Number(item.badge) > 0 ? (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 99,
                    background: "rgba(56, 189, 248, 0.2)",
                    color: "#38bdf8",
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </span>
            {item.hint && !secondary ? (
              <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>{item.hint}</span>
            ) : null}
          </span>
        );

        if (item.to) {
          return (
            <Link key={item.id} to={item.to} style={subNavLink(activeId === item.id)}>
              {label}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            style={{
              ...subNavLink(activeId === item.id),
              border: "none",
              font: "inherit",
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
