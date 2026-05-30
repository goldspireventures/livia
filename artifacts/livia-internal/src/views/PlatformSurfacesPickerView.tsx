import { useEffect, useMemo, useState } from "react";
import {
  FINAL_PLATFORM_SCREENS,
  FINAL_SCREEN_GROUPS,
  allImagesForScreen,
  screensForGroup,
  type FinalScreenGroup,
} from "../lib/platform-surfaces-concepts";
import { buttonStyle } from "../styles/ops-ui";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0f172a",
  color: "#e2e8f0",
  padding: "24px 32px 48px",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.5,
};

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 16,
};

function tabBtn(active: boolean): React.CSSProperties {
  return {
    ...buttonStyle,
    background: active ? "#38bdf8" : "#334155",
    color: active ? "#0f172a" : "#e2e8f0",
  };
}

/** Dev gallery — final screen catalog. Open: /experience/platform-surfaces */
export function PlatformSurfacesPickerView() {
  const [group, setGroup] = useState<FinalScreenGroup>("marketing");
  const [screenId, setScreenId] = useState("m1-home");
  const [variantId, setVariantId] = useState("main");

  const groupScreens = useMemo(() => screensForGroup(group), [group]);
  const selected = useMemo(
    () => FINAL_PLATFORM_SCREENS.find((s) => s.id === screenId) ?? groupScreens[0] ?? null,
    [screenId, groupScreens],
  );
  const images = useMemo(() => (selected ? allImagesForScreen(selected) : []), [selected]);
  const activeImage = useMemo(
    () => images.find((v) => v.id === variantId) ?? images[0],
    [images, variantId],
  );

  useEffect(() => {
    const first = screensForGroup(group)[0];
    if (first) setScreenId(first.id);
    setVariantId("main");
  }, [group]);

  useEffect(() => {
    setVariantId("main");
  }, [screenId]);

  return (
    <div style={page}>
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: 6,
            background: "#f59e0b22",
            color: "#fbbf24",
            fontSize: 12,
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          FINAL CATALOG — dev only
        </p>
        <h1 style={{ margin: "12px 0 6px", fontSize: 26, fontWeight: 650 }}>Platform surfaces</h1>
        <p style={{ margin: 0, maxWidth: 720, color: "#94a3b8", fontSize: 14 }}>
          Locked + north-star screens. Spec:{" "}
          <code>docs/design/PLATFORM-SURFACES-FINAL-CATALOG.md</code>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
        <aside style={card}>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, color: "#fbbf24" }}>Worlds</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FINAL_SCREEN_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                style={{
                  ...buttonStyle,
                  width: "100%",
                  textAlign: "left",
                  background: group === g.id ? "#38bdf8" : "#0f172a",
                  color: group === g.id ? "#0f172a" : "#e2e8f0",
                }}
                onClick={() => setGroup(g.id)}
              >
                <div style={{ fontWeight: 600 }}>{g.label}</div>
              </button>
            ))}
          </div>
          <h2 style={{ margin: "16px 0 8px", fontSize: 14, color: "#fbbf24" }}>Screens</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {groupScreens.map((s) => (
              <button
                key={s.id}
                type="button"
                style={{
                  ...buttonStyle,
                  width: "100%",
                  textAlign: "left",
                  fontSize: 12,
                  background: screenId === s.id ? "#334155" : "transparent",
                  color: "#e2e8f0",
                }}
                onClick={() => setScreenId(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </aside>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {selected && activeImage ? (
            <>
              <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h2 style={{ margin: 0, fontSize: 18 }}>
                    {selected.name}{" "}
                    <span style={{ color: "#64748b", fontWeight: 400 }}>({selected.docSection})</span>
                  </h2>
                  <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 }}>{selected.tagline}</p>
                </div>
                {images.length > 1 ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    {images.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        style={tabBtn(variantId === v.id)}
                        onClick={() => setVariantId(v.id)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={{ ...card, padding: 8, background: "#0b1224" }}>
                <img
                  src={`/platform-surfaces/${activeImage.imageFile}`}
                  alt={selected.name}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 8,
                    border: "1px solid #334155",
                    display: "block",
                  }}
                />
              </div>

              <div style={{ fontSize: 12, color: "#64748b" }}>
                File: <code>{activeImage.imageFile}</code> · status: {selected.status}
              </div>
            </>
          ) : (
            <div style={card}>
              <p style={{ margin: 0, color: "#94a3b8" }}>No screen selected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
