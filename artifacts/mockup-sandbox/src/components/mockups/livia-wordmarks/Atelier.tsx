export default function Atelier() {
  const cream = "#f4f1ea";
  const gold = "#c9a96a";
  const goldLight = "#e8cf9b";
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1100px 600px at 30% 10%, #1c1633 0%, #0b0a14 60%, #060509 100%)",
        color: cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
        padding: 48,
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap"
      />

      {/* Lv monogram — serif, italic gold v */}
      <div
        style={{
          width: 144,
          height: 144,
          borderRadius: "50%",
          border: "1px solid rgba(244,241,234,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 30%, rgba(201,169,106,0.15), transparent 60%)",
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: 76,
            fontWeight: 400,
            lineHeight: 1,
            color: cream,
            letterSpacing: "-0.04em",
          }}
        >
          L
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              background: `linear-gradient(180deg, ${goldLight} 0%, ${gold} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginLeft: -6,
            }}
          >
            v
          </span>
        </span>
      </div>

      {/* Wordmark — serif Livia with italic gold v */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 124,
            fontWeight: 300,
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          Li
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              background: `linear-gradient(180deg, ${goldLight} 0%, ${gold} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            v
          </span>
          ia
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: "rgba(244,241,234,0.55)",
          }}
        >
          The OS for Modern Salons
        </div>
      </div>

      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          color: "rgba(244,241,234,0.7)",
          padding: "8px 16px",
          border: "1px solid rgba(201,169,106,0.4)",
          borderRadius: 999,
          letterSpacing: "0.08em",
        }}
      >
        meet{" "}
        <em style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, color: gold }}>
          Liv
        </em>{" "}
        — your AI inside Livia
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          fontFamily: "Inter, sans-serif",
          fontSize: 10,
          color: "rgba(244,241,234,0.35)",
          letterSpacing: "0.1em",
        }}
      >
        D · ATELIER — A's serif × C's Lv mark + italic gold v
      </div>
    </div>
  );
}
