export default function Maison() {
  const bone = "#f1ece2";
  const ink = "#1a1814";
  const gold = "#a88542";
  const goldDeep = "#7a5e2a";
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(900px 600px at 30% 20%, #f7f3e9 0%, #efe9dc 55%, #e6dfce 100%)",
        color: ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
        padding: 48,
        position: "relative",
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap"
      />

      {/* Subtle paper texture via gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 70% 80%, rgba(168,133,66,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Lv monogram — bone roundel with gold v */}
      <div
        style={{
          width: 144,
          height: 144,
          borderRadius: "50%",
          background: bone,
          border: `1px solid ${ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow: "0 12px 30px -10px rgba(26,24,20,0.18)",
        }}
      >
        <span
          style={{
            fontSize: 76,
            fontWeight: 400,
            lineHeight: 1,
            color: ink,
            letterSpacing: "-0.04em",
          }}
        >
          L
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              background: `linear-gradient(180deg, ${gold} 0%, ${goldDeep} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginLeft: -6,
            }}
          >
            v
          </span>
        </span>
      </div>

      {/* Wordmark — ink serif with gold italic v */}
      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            fontSize: 124,
            fontWeight: 400,
            letterSpacing: "0.015em",
            lineHeight: 1,
            color: ink,
          }}
        >
          Li
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              background: `linear-gradient(180deg, ${gold} 0%, ${goldDeep} 100%)`,
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
            fontWeight: 500,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: "rgba(26,24,20,0.55)",
          }}
        >
          Maison · Salon · Spa · Studio
        </div>
      </div>

      <div
        style={{
          position: "relative",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          color: "rgba(26,24,20,0.7)",
          padding: "8px 16px",
          border: `1px solid ${ink}33`,
          background: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(6px)",
          borderRadius: 999,
          letterSpacing: "0.08em",
        }}
      >
        meet{" "}
        <em style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, color: goldDeep }}>
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
          color: "rgba(26,24,20,0.4)",
          letterSpacing: "0.1em",
        }}
      >
        F · MAISON — cream/bone, serif, deep gold v
      </div>
    </div>
  );
}
