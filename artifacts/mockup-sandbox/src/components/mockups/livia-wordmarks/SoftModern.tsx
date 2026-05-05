export default function SoftModern() {
  const aurora =
    "linear-gradient(100deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)";
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#fafafa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
        padding: 48,
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400&display=swap"
      />

      {/* Aurora glow blobs */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(420px 280px at 25% 30%, rgba(139,92,246,0.35), transparent 70%), radial-gradient(420px 280px at 75% 70%, rgba(6,182,212,0.30), transparent 70%), radial-gradient(360px 240px at 50% 90%, rgba(16,185,129,0.18), transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Soft mark — rounded "l" dot */}
      <div
        style={{
          position: "relative",
          width: 96,
          height: 96,
          borderRadius: 28,
          background: aurora,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 30px 80px -20px rgba(139,92,246,0.55)",
        }}
      >
        <div
          style={{
            width: 18,
            height: 56,
            borderRadius: 999,
            background: "#0a0a0f",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -22,
              left: "50%",
              transform: "translateX(-50%)",
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "#0a0a0f",
            }}
          />
        </div>
      </div>

      {/* Wordmark */}
      <div style={{ position: "relative", textAlign: "center" }}>
        <div
          style={{
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 0.95,
            background: aurora,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          livia
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(250,250,250,0.6)",
            letterSpacing: "0.02em",
          }}
        >
          the operating system for service businesses
        </div>
      </div>

      {/* Liv chip */}
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 18px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(12px)",
          fontSize: 13,
          color: "rgba(250,250,250,0.85)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: aurora,
            boxShadow: "0 0 12px rgba(6,182,212,0.8)",
          }}
        />
        powered by <strong style={{ color: "#fafafa", fontWeight: 700 }}>Liv</strong>, your AI assistant
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
          color: "rgba(250,250,250,0.4)",
          letterSpacing: "0.1em",
          zIndex: 1,
        }}
      >
        B · SOFT MODERN — Aurora gradient wordmark
      </div>
    </div>
  );
}
