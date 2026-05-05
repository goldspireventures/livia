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

      {/* Lv monogram — sharp geometric, chrome v */}
      <div
        style={{
          width: 132,
          height: 132,
          borderRadius: 4,
          background: ink,
          border: "1px solid rgba(217,195,154,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow:
            "0 0 0 1px rgba(217,195,154,0.08), 0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <svg width="84" height="84" viewBox="0 0 84 84" fill="none">
          <defs>
            <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="84" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f6f3ec" />
              <stop offset="45%" stopColor="#d9c39a" />
              <stop offset="60%" stopColor="#8a7549" />
              <stop offset="78%" stopColor="#d9c39a" />
              <stop offset="100%" stopColor="#f6f3ec" />
            </linearGradient>
          </defs>
          {/* Hairline L */}
          <path
            d="M14 8 L14 70 L42 70"
            stroke={cream}
            strokeWidth="2.5"
            strokeLinecap="square"
            fill="none"
          />
          {/* Chrome v — sharp vee */}
          <path
            d="M36 30 L52 70 L72 30"
            stroke="url(#chrome)"
            strokeWidth="3"
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
          />
        </svg>
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
            marginTop: 20,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            fontWeight: 300,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: champagne,
            paddingLeft: "0.5em",
          }}
        >
          Operating System · 2026
        </div>
      </div>

      {/* Liv chip — minimal, mono */}
      <div
        style={{
          position: "relative",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
          color: "rgba(246,243,236,0.65)",
          padding: "8px 16px",
          border: "1px solid rgba(217,195,154,0.25)",
          background: "rgba(10,10,16,0.5)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        powered by{" "}
        <span style={{ background: chromeGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 500 }}>
          Liv
        </span>{" "}
        · ai
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
