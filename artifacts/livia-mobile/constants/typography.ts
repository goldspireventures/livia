/**
 * Typography vocabulary for Livia mobile (ADR 0008).
 *
 * Two families:
 *   - Cormorant Garamond — display + headlines + serif accents
 *   - Inter — UI, body, numerics (use the *Italic / Bold variants for tabular)
 *
 * Anchor sizes intentionally narrow. Resist the urge to add more.
 */
export const fonts = {
  serif: "CormorantGaramond_400Regular",
  serifItalic: "CormorantGaramond_400Regular_Italic",
  serifMedium: "CormorantGaramond_500Medium",
  serifMediumItalic: "CormorantGaramond_500Medium_Italic",
  body: "Inter_400Regular",
  bodyMed: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  /** Uppercase labels / demo tags (Inter semibold; no separate mono face loaded). */
  mono: "Inter_600SemiBold",
} as const;

export const type = {
  /** Hero serif — sign-in / onboarding / dashboard greeting line 1. */
  display: { fontFamily: fonts.serif, fontSize: 38, lineHeight: 44, letterSpacing: -0.6 },
  /** Hero serif italic — the muted continuation. */
  displayItalic: { fontFamily: fonts.serifItalic, fontSize: 38, lineHeight: 44, letterSpacing: -0.4 },
  /** Section serif — secondary screen titles, "Upcoming bookings". */
  title: { fontFamily: fonts.serifMedium, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  /** Inline serif accent — wordmark, AI suggestions. */
  serifSm: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 22 },
  /** UI labels, row titles. */
  label: { fontFamily: fonts.bodyMed, fontSize: 13, letterSpacing: 0.2 },
  /** Default body. */
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  /** Big numerics on stat cards / countdowns. */
  numeric: { fontFamily: fonts.bodyBold, fontSize: 32, letterSpacing: -1, fontVariant: ["tabular-nums" as const] },
  /** Smaller numerics for inline counts. */
  numericSm: { fontFamily: fonts.bodySemi, fontSize: 14, fontVariant: ["tabular-nums" as const] },
  /** Caption / muted helper text. */
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  /** Eyebrow / uppercased section headers. */
  eyebrow: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase" as const },
};
