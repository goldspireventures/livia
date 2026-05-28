/**
 * Medspa procedure catalog + consent copy (draft — counsel review before market claims).
 * @see docs/product/V3-REAL-WORLD-SCENARIOS.md Block N / medspa
 */

export type MedspaProcedure = {
  code: string;
  label: string;
  /** Minimum consent pack version required */
  consentVersion: string;
  summary: string;
  risksBullets: string[];
};

export const MEDSPA_CONSENT_VERSION = "2026.05-draft";

export const MEDSPA_PROCEDURES: MedspaProcedure[] = [
  {
    code: "botox-consult",
    label: "Botox — consultation",
    consentVersion: MEDSPA_CONSENT_VERSION,
    summary: "Neuromodulator consultation and treatment planning.",
    risksBullets: [
      "Temporary bruising or swelling at injection sites",
      "Asymmetry until product settles (typically days)",
      "Rare allergic reaction — seek urgent care if breathing difficulty",
    ],
  },
  {
    code: "dermal-filler",
    label: "Dermal filler",
    consentVersion: MEDSPA_CONSENT_VERSION,
    summary: "Hyaluronic acid or compatible filler treatment.",
    risksBullets: [
      "Swelling, tenderness, or lumps that usually resolve",
      "Vascular occlusion is rare but serious — clinic emergency protocol applies",
      "Do not fly or sauna for 48h if your clinician advised",
    ],
  },
  {
    code: "chemical-peel-light",
    label: "Light chemical peel",
    consentVersion: MEDSPA_CONSENT_VERSION,
    summary: "Superficial peel for texture and tone.",
    risksBullets: [
      "Redness and peeling for several days",
      "Sun avoidance required; SPF mandatory",
      "Disclose retinoids, pregnancy, and recent procedures",
    ],
  },
  {
    code: "laser-hair-reduction",
    label: "Laser hair reduction",
    consentVersion: MEDSPA_CONSENT_VERSION,
    summary: "Laser or IPL hair reduction course.",
    risksBullets: [
      "Patch test may be required for Fitzpatrick IV–VI",
      "Avoid sun and fake tan before treatment",
      "Multiple sessions needed for durable reduction",
    ],
  },
];

export function getMedspaProcedure(code: string): MedspaProcedure | undefined {
  return MEDSPA_PROCEDURES.find((p) => p.code === code);
}

export function buildMedspaConsentBody(procedure: MedspaProcedure, marketCode: string): string {
  const risks = procedure.risksBullets.map((b) => `• ${b}`).join("\n");
  return [
    `Procedure: ${procedure.label}`,
    `Market: ${marketCode}`,
    `Version: ${procedure.consentVersion}`,
    "",
    procedure.summary,
    "",
    "You acknowledge you have disclosed relevant medical history and understand:",
    risks,
    "",
    "This is informational consent copy — your clinic may provide additional forms.",
  ].join("\n");
}
