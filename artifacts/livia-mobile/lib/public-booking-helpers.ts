/** B2C public booking helpers — kept in sync with dashboard public-booking-helpers. */

export function guessMedspaProcedureCode(
  serviceName: string,
  procedures: { code: string; label: string }[],
): string {
  if (!procedures.length) return "";
  const n = serviceName.toLowerCase();
  const byCode = (code: string) => procedures.find((p) => p.code === code)?.code;
  if (n.includes("filler")) return byCode("dermal-filler") ?? procedures[0]!.code;
  if (n.includes("peel")) return byCode("chemical-peel-light") ?? procedures[0]!.code;
  if (n.includes("botox") && !n.includes("consult")) {
    return byCode("botox-consult") ?? procedures[0]!.code;
  }
  if (n.includes("consult")) {
    return procedures.find((p) => p.code.includes("consult"))?.code ?? procedures[0]!.code;
  }
  return procedures.find((p) => !p.code.includes("consult"))?.code ?? procedures[0]!.code;
}

export function publicCareNotes(vertical?: string | null): string[] {
  switch (vertical) {
    case "beauty":
      return [
        "Patch tests may be required 24–48h before lash or tint services.",
        "Arrive with clean lashes/nails and no heavy oils on the treatment area.",
      ];
    case "hair":
      return [
        "For colour appointments, bring reference photos if you have them.",
        "Running late? Message the team — we'll do our best to fit you in.",
      ];
    case "medspa":
      return [
        "Consultations are required for first-time injectable treatments.",
        "Avoid blood thinners and alcohol 24h before certain procedures unless your clinician advises otherwise.",
      ];
    case "body-art":
      return [
        "Consultations are free — session work may require a deposit for long slots.",
        "Come rested, fed, and hydrated; avoid alcohol before your session.",
      ];
    default:
      return ["You'll get a confirmation by email or SMS with visit details."];
  }
}
