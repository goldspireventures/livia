export default function Empress() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, #1a1530 0%, #09090b 60%)",
        color: "#f4f1ea",
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
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Inter:wght@300;400;500&display=swap"
      />

      {/* Monogram */}
      <div
        style={{
          width: 132,
          height: 132,
          borderRadius: "50%",
          border: "1px solid rgba(244,241,234,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.18), transparent 60%)",
        }}
      >
        <span
          style={{
            fontSize: 78,
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1,
            background: "linear-gradient(180deg, #f4f1ea 0%, #c9a96a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            paddingRight: 4,
          }}
        >
          L
        </span>
      </div>

      {/* Wordmark */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 110,
            fontWeight: 300,
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          Livia
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

      {/* Liv chip */}
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
        meet <em style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, color: "#c9a96a" }}>Liv</em> — your AI inside Livia
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
        A · EMPRESS — classical serif, gold accent
      </div>
    </div>
  );
}
