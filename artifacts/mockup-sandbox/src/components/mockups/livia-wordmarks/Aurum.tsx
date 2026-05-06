export default function Aurum() {
  const ink = "#0a0a10";
  const cream = "#f6f3ec";
  const champagne = "#d9c39a";
  const chromeGrad =
    "linear-gradient(180deg, #f6f3ec 0%, #d9c39a 45%, #8a7549 60%, #d9c39a 78%, #f6f3ec 100%)";
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 700px at 50% 0%, #14131c 0%, #08080d 60%, #04040a 100%)",
        color: cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 48,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=Inter:wght@200;300;400;500&family=JetBrains+Mono:wght@300;400&display=swap"
      />

      {/* Hairline grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(217,195,154,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(217,195,154,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Champagne aura */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(217,195,154,0.18) 0%, transparent 60%)",
          filter: "blur(20px)",
        }}
      />

      {/* Lv monogram — soft roundel (D-style), chrome italic v */}
      <div
        style={{
          width: 144,
          height: 144,
          borderRadius: "50%",
          border: "1px solid rgba(246,243,236,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 30%, rgba(217,195,154,0.18), transparent 65%)",
          position: "relative",
          boxShadow:
            "0 30px 80px -30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
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
              background: chromeGrad,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginLeft: -6,
            }}
          >
            v
          </span>
        </span>
      </div>

      {/* Wordmark — Didone serif, chrome v */}
      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 130,
            fontWeight: 300,
            letterSpacing: "0.06em",
            lineHeight: 1,
            color: cream,
          }}
        >
          Li
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              background: chromeGrad,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              padding: "0 2px",
            }}
          >
            v
          </span>
          ia
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: 20,
            fontWeight: 300,
            letterSpacing: "0.01em",
            color: "rgba(246,243,236,0.78)",
            maxWidth: 720,
            margin: "22px auto 0",
            lineHeight: 1.45,
          }}
        >
          For barbershops, tattoo studios, dental practices
          <span style={{ color: champagne }}> — </span>
          and every appointment in between.
        </div>
      </div>

      {/* Liv presence — quiet serif italic */}
      <div
        style={{
          position: "relative",
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: 17,
          fontWeight: 300,
          color: "rgba(246,243,236,0.55)",
          letterSpacing: "0.02em",
        }}
      >
        with{" "}
        <span
          style={{
            background: chromeGrad,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 400,
          }}
        >
          Liv
        </span>{" "}
        at your side
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
          color: "rgba(217,195,154,0.4)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        E · AURUM — futuristic lux, chrome champagne
      </div>
    </div>
  );
}
