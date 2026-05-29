import React from "react";
import type { ConceptId } from "../lib/onboarding-experience-concepts";
import { JOURNEY_ACTS, ONBOARDING_CONCEPTS } from "../lib/onboarding-experience-concepts";

/** Livia dashboard–adjacent tokens for hi-fi mocks (light shell). */
const L = {
  page: "#f8fafc",
  card: "#ffffff",
  border: "#e4e4e7",
  text: "#18181b",
  muted: "#71717a",
  primary: "#06b6d4",
  primaryDark: "#0891b2",
  violet: "#8b5cf6",
  violetSoft: "#ede9fe",
  champagne: "#d9c39a",
  mint: "#10b981",
  success: "#dcfce7",
  radius: 12,
  font: "'Segoe UI', system-ui, sans-serif",
  display: "'Segoe UI', system-ui, sans-serif",
};

const phoneShell: React.CSSProperties = {
  width: 200,
  borderRadius: 28,
  border: "2px solid #334155",
  background: "linear-gradient(165deg, #1e1b4b 0%, #0f172a 45%, #0c1222 100%)",
  padding: "10px 8px 14px",
  boxSizing: "border-box",
  flexShrink: 0,
};

function MockLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: L.muted,
        marginBottom: 8,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function DashboardChrome({ children, progress }: { children: React.ReactNode; progress?: number }) {
  return (
    <div
      style={{
        background: L.page,
        borderRadius: L.radius,
        border: `1px solid ${L.border}`,
        overflow: "hidden",
        fontFamily: L.font,
        color: L.text,
        maxWidth: 640,
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${L.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: L.card,
        }}
      >
        <div style={{ fontFamily: L.display, fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>
          Livia
        </div>
        <div style={{ flex: 1, height: 6, background: "#f4f4f5", borderRadius: 99 }}>
          <div
            style={{
              width: `${progress ?? 42}%`,
              height: "100%",
              borderRadius: 99,
              background: `linear-gradient(90deg, ${L.violet}, ${L.primary})`,
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: L.muted, fontWeight: 500 }}>{progress ?? 42}%</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function LivAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${L.violet}, ${L.primary})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      Liv
    </div>
  );
}

function ColdOpenMock() {
  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 280px" }}>
        <MockLabel>Web — welcome</MockLabel>
        <DashboardChrome progress={0}>
          <div
            style={{
              borderRadius: L.radius,
              overflow: "hidden",
              border: `1px solid ${L.primary}33`,
              background: L.violetSoft,
            }}
          >
            <div
              style={{
                aspectRatio: "16/9",
                background: `linear-gradient(145deg, #1e1b4b, #0f172a)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "2px solid #fff8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "10px solid transparent",
                    borderBottom: "10px solid transparent",
                    borderLeft: "16px solid #fff",
                    marginLeft: 4,
                  }}
                />
              </div>
              <span
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 12,
                  fontSize: 11,
                  color: "#e2e8f0",
                }}
              >
                0:15 · See your first day with Liv
              </span>
            </div>
            <div style={{ padding: "12px 14px", background: L.card }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Watch before you set up</div>
              <div style={{ fontSize: 12, color: L.muted, marginTop: 4 }}>
                Phone rings → Liv answers → booking lands on your calendar.
              </div>
            </div>
          </div>
        </DashboardChrome>
      </div>
      <div>
        <MockLabel>Phone — incoming</MockLabel>
        <div style={phoneShell}>
          <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", marginBottom: 8 }}>9:41</div>
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 11, color: L.champagne, fontWeight: 600 }}>Liv · Luxe Salon</div>
            <div style={{ fontSize: 13, color: "#f1f5f9", marginTop: 6, lineHeight: 1.4 }}>
              Hi Sarah — I’ve booked you Thursday 2pm with Emma. See you then.
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>Calendar updated</div>
        </div>
      </div>
    </div>
  );
}

function ChapterSpineMock() {
  const current = 5;
  return (
    <DashboardChrome progress={50}>
      <MockLabel>Chapter spine</MockLabel>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {JOURNEY_ACTS.map((act, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={act} style={{ flex: "0 0 auto", textAlign: "center", minWidth: 44 }}>
              <div
                style={{
                  height: active ? 48 : done ? 28 : 20,
                  borderRadius: 8,
                  background: active
                    ? `linear-gradient(180deg, ${L.primary}, ${L.violet})`
                    : done
                      ? L.primary + "44"
                      : "#f4f4f5",
                  border: active ? `2px solid ${L.primary}` : `1px solid ${L.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: active || done ? "#fff" : L.muted,
                }}
              >
                {act}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background: L.card, border: `1px solid ${L.border}`, borderRadius: L.radius, padding: 16 }}>
        <div style={{ fontSize: 11, color: L.primary, fontWeight: 600, marginBottom: 4 }}>Chapter 6 · Meet Liv</div>
        <div style={{ fontSize: 18, fontWeight: 600, fontFamily: L.display }}>Choose how Liv greets your clients</div>
        <div style={{ fontSize: 13, color: L.muted, marginTop: 6 }}>Tone, greeting, and when she can book for you.</div>
      </div>
    </DashboardChrome>
  );
}

function LivRehearsalMock() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 260px" }}>
        <MockLabel>Dashboard — A6</MockLabel>
        <DashboardChrome progress={50}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Meet Liv</div>
          <label style={{ fontSize: 12, color: L.muted }}>Greeting</label>
          <div
            style={{
              marginTop: 6,
              padding: "10px 12px",
              border: `1px solid ${L.border}`,
              borderRadius: 8,
              fontSize: 14,
              background: L.card,
            }}
          >
            Hi! I&apos;m Liv at Luxe Salon — how can I help you book today?
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            {["Warm", "Professional", "Playful"].map((t, i) => (
              <span
                key={t}
                style={{
                  padding: "6px 12px",
                  borderRadius: 99,
                  fontSize: 12,
                  background: i === 0 ? L.violetSoft : "#f4f4f5",
                  color: i === 0 ? L.violet : L.muted,
                  fontWeight: 500,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <button
            type="button"
            style={{
              marginTop: 14,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: L.primary,
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "default",
            }}
          >
            Preview reply
          </button>
        </DashboardChrome>
      </div>
      <div>
        <MockLabel>Live preview</MockLabel>
        <div style={phoneShell}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <LivAvatar size={28} />
            <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>Liv</span>
            <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>typing…</span>
          </div>
          <div style={{ background: "rgba(6,182,212,0.2)", borderRadius: 12, padding: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#f1f5f9", lineHeight: 1.45 }}>
              Hi! I&apos;m Liv at Luxe Salon — how can I help you book today?
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 10, alignSelf: "flex-end" }}>
            <div style={{ fontSize: 12, color: "#cbd5e1" }}>Cut and colour next week?</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SplitScreenMock() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0,
        borderRadius: L.radius,
        overflow: "hidden",
        border: `1px solid ${L.border}`,
        maxWidth: 640,
        fontFamily: L.font,
      }}
    >
      <div style={{ padding: 16, background: L.card, borderRight: `1px solid ${L.border}` }}>
        <MockLabel>A8 — your link</MockLabel>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Public booking page</div>
        <label style={{ fontSize: 11, color: L.muted }}>URL slug</label>
        <div style={{ display: "flex", marginTop: 6, alignItems: "center", gap: 0 }}>
          <span style={{ fontSize: 12, color: L.muted, padding: "8px 10px", background: "#f4f4f5", borderRadius: "8px 0 0 8px" }}>
            livia.app/b/
          </span>
          <input
            readOnly
            value="luxe-salon"
            style={{
              flex: 1,
              padding: "8px 10px",
              border: `1px solid ${L.primary}`,
              borderRadius: "0 8px 8px 0",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: L.mint, marginTop: 8, fontWeight: 500 }}>Available — updates live →</div>
      </div>
      <div style={{ padding: 16, background: "#fafafa" }}>
        <MockLabel>Customer view</MockLabel>
        <div style={{ fontFamily: L.display, fontSize: 16, fontWeight: 700 }}>Luxe Salon</div>
        <div style={{ fontSize: 11, color: L.muted, marginBottom: 10 }}>Dublin · Hair & beauty</div>
        {["Cut & blow-dry", "Full colour", "Consultation"].map((s, i) => (
          <div
            key={s}
            style={{
              padding: "10px 12px",
              background: L.card,
              border: `1px solid ${L.border}`,
              borderRadius: 8,
              marginBottom: 6,
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{s}</span>
            <span style={{ color: L.primary, fontWeight: 600 }}>{i === 0 ? "Book" : "from €45"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoLiveBeatMock() {
  return (
    <DashboardChrome progress={100}>
      <div
        style={{
          textAlign: "center",
          padding: "20px 12px",
          background: `linear-gradient(180deg, ${L.champagne}33, transparent)`,
          borderRadius: L.radius,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: L.mint,
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
            lineHeight: "40px",
            margin: "0 auto 8px",
          }}
        >
          {"\u2713"}
        </div>
        <div style={{ fontFamily: L.display, fontSize: 20, fontWeight: 700 }}>You&apos;re live</div>
        <div style={{ fontSize: 13, color: L.muted, marginTop: 4 }}>Liv is answering. Your team can open the cockpit.</div>
      </div>
      <MockLabel>Cockpit reveals</MockLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { t: "Today", v: "8 bookings" },
          { t: "Inbox", v: "3 for Liv" },
          { t: "Revenue", v: "€1,240" },
        ].map((c, i) => (
          <div
            key={c.t}
            style={{
              padding: 12,
              background: L.card,
              border: `1px solid ${L.border}`,
              borderRadius: 8,
              opacity: 0.4 + i * 0.25,
              transform: `translateY(${8 - i * 4}px)`,
            }}
          >
            <div style={{ fontSize: 10, color: L.muted }}>{c.t}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{c.v}</div>
          </div>
        ))}
      </div>
    </DashboardChrome>
  );
}

function StuckVideoMock() {
  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ ...phoneShell, width: 160, padding: 8 }}>
        <div
          style={{
            aspectRatio: "9/16",
            borderRadius: 16,
            background: `linear-gradient(180deg, #312e81, #0f172a)`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 12,
          }}
        >
          <div style={{ fontSize: 11, color: L.champagne, fontWeight: 600 }}>Luxe Salon</div>
          <div style={{ fontSize: 13, color: "#fff", marginTop: 6, lineHeight: 1.35 }}>
            You&apos;re on step 7 — connect WhatsApp. Takes 3 minutes.
          </div>
          <div
            style={{
              marginTop: 10,
              padding: "8px 0",
              textAlign: "center",
              background: L.primary,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            Continue setup
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 200, fontFamily: L.font }}>
        <MockLabel>48h nudge email</MockLabel>
        <div style={{ background: L.card, border: `1px solid ${L.border}`, borderRadius: L.radius, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Pick up where you left off</div>
          <div style={{ fontSize: 12, color: L.muted, marginTop: 8 }}>
            Hi Eamon — Luxe Salon is 58% ready. Connect WhatsApp so Liv can reply from your real number.
          </div>
        </div>
      </div>
    </div>
  );
}

function LivContinuityMock() {
  const steps = [
    { label: "livia.io", sub: "Brand film" },
    { label: "Sign in", sub: "Aurora welcome" },
    { label: "Onboarding A6", sub: "Same Liv pulse" },
    { label: "Inbox", sub: "Same avatar" },
  ];
  return (
    <div style={{ fontFamily: L.font, maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <LivAvatar size={36} />
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: L.muted }}>{s.sub}</div>
            </div>
            {i < steps.length - 1 ? (
              <div style={{ flex: "0 0 24px", height: 2, background: `linear-gradient(90deg, ${L.violet}, ${L.primary})` }} />
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <p style={{ fontSize: 12, color: L.muted, marginTop: 16, textAlign: "center" }}>
        One colleague — never a different “AI widget” per screen.
      </p>
    </div>
  );
}

function ActLoopsMock() {
  const acts = ["Hours", "Channels", "Billing", "Team"];
  return (
    <DashboardChrome progress={35}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {acts.map((a) => (
          <div
            key={a}
            style={{
              borderRadius: 8,
              overflow: "hidden",
              border: `1px solid ${L.border}`,
              background: L.card,
            }}
          >
            <div
              style={{
                aspectRatio: "16/10",
                background: `linear-gradient(135deg, #1e1b4b, #0f172a)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #fff6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ borderLeft: "10px solid #fff", borderTop: "6px solid transparent", borderBottom: "6px solid transparent", marginLeft: 3 }} />
              </div>
              <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 9, color: "#94a3b8" }}>0:06</span>
            </div>
            <div style={{ padding: "8px 10px", fontSize: 12, fontWeight: 500 }}>{a}</div>
          </div>
        ))}
      </div>
    </DashboardChrome>
  );
}

function TimelineFillMock() {
  const items = [
    { time: "09:00", label: "Emma — Cut & colour", on: true },
    { time: "11:30", label: "Walk-in — Consultation", on: true },
    { time: "14:00", label: "Liv booked — Sarah", on: true },
    { time: "16:30", label: "—", on: false },
  ];
  return (
    <DashboardChrome progress={75}>
      <MockLabel>Cockpit · today</MockLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "10px 0",
              borderLeft: item.on ? `3px solid ${L.primary}` : `3px solid ${L.border}`,
              paddingLeft: 12,
              opacity: item.on ? 1 : 0.35,
              animation: item.on ? `fadeIn 0.4s ease ${i * 0.1}s both` : undefined,
            }}
          >
            <span style={{ fontSize: 11, color: L.muted, width: 40 }}>{item.time}</span>
            <span style={{ fontSize: 13, fontWeight: item.on ? 500 : 400 }}>{item.label}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }`}</style>
    </DashboardChrome>
  );
}

const MOCK_BY_ID: Record<ConceptId, () => React.ReactElement> = {
  "cold-open": ColdOpenMock,
  "chapter-spine": ChapterSpineMock,
  "liv-rehearsal": LivRehearsalMock,
  "split-screen": SplitScreenMock,
  "go-live-beat": GoLiveBeatMock,
  "stuck-video": StuckVideoMock,
  "liv-continuity": LivContinuityMock,
  "act-loops": ActLoopsMock,
  "timeline-fill": TimelineFillMock,
};

export function OnboardingExperienceMock({ conceptId }: { conceptId: ConceptId }) {
  const Mock = MOCK_BY_ID[conceptId];
  const meta = ONBOARDING_CONCEPTS.find((c) => c.id === conceptId);
  return (
    <div>
      <div
        style={{
          marginBottom: 12,
          padding: "8px 12px",
          background: "#0c4a6e",
          borderRadius: 8,
          fontSize: 12,
          color: "#bae6fd",
        }}
      >
        Hi-fi mock — layout & copy aligned to Livia dashboard / mobile (not production screenshot).
      </div>
      <Mock />
      {meta ? (
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 14, marginBottom: 0 }}>{meta.payoff}</p>
      ) : null}
    </div>
  );
}
