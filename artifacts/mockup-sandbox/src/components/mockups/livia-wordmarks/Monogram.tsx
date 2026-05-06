export default function Monogram() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fafafa 0%, #f1efe9 100%)",
        color: "#09090b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 48,
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap"
      />

      {/* Lv interlocked monogram */}
      <div
        style={{
          width: 144,
          height: 144,
          borderRadius: 32,
          background: "#09090b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow:
            "0 30px 60px -30px rgba(9,9,11,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="92" y2="92" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          {/* L */}
          <path
            d="M14 10 L14 78 L48 78"
            stroke="#fafafa"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* v stroked, originating where L ends */}
          <path
            d="M40 38 L58 78 L78 38"
            stroke="url(#g1)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Wordmark — geometric, with lifted "v" */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Fraunces', 'Inter', serif",
            fontSize: 108,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            color: "#09090b",
          }}
        >
          li
          <span
            style={{
              background:
                "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontStyle: "italic",
            }}
          >
            v
          </span>
          ia
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(9,9,11,0.5)",
          }}
        >
          Salon · Spa · Studio · OS
        </div>
      </div>

      {/* Liv as the heart */}
      <div
        style={{
          fontSize: 13,
          color: "rgba(9,9,11,0.65)",
          padding: "9px 18px",
          border: "1px solid rgba(9,9,11,0.12)",
          borderRadius: 999,
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        the <strong style={{ color: "#09090b" }}>Liv</strong> at the center is your AI
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          fontSize: 10,
          color: "rgba(9,9,11,0.4)",
          letterSpacing: "0.1em",
          fontWeight: 500,
        }}
      >
        C · MONOGRAM — Lv mark, light theme, accented v
      </div>
    </div>
  );
}
