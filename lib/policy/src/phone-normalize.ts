/**
 * Normalize phone for customer match keys (E.164-ish, IE-first defaults).
 * Shared by api-server public book, SMS, and voice paths.
 */

const DEFAULT_COUNTRY = "IE";

/** Strip spaces, dashes, parens; keep leading +. */
export function stripPhoneFormatting(raw: string): string {
  return raw.replace(/[\s\-().]/g, "").trim();
}

/**
 * Best-effort E.164 normalize. Returns null if too short to be valid.
 * IE: 087… → +35387… ; already +353… unchanged.
 */
export function normalizePhoneE164(
  raw: string | null | undefined,
  defaultCountry: string = DEFAULT_COUNTRY,
): string | null {
  if (!raw) return null;
  let p = stripPhoneFormatting(raw);
  if (!p) return null;

  if (p.startsWith("00")) p = `+${p.slice(2)}`;

  if (p.startsWith("+")) {
    const digits = p.slice(1).replace(/\D/g, "");
    if (digits.length < 8) return null;
    return `+${digits}`;
  }

  const digits = p.replace(/\D/g, "");
  if (digits.length < 7) return null;

  if (defaultCountry === "IE") {
    if (digits.startsWith("353")) return `+${digits}`;
    if (digits.startsWith("0")) return `+353${digits.slice(1)}`;
    if (digits.length === 9 && /^8/.test(digits)) return `+353${digits}`;
  }

  if (defaultCountry === "GB") {
    if (digits.startsWith("44")) return `+${digits}`;
    if (digits.startsWith("0")) return `+44${digits.slice(1)}`;
  }

  return digits.startsWith("+") ? digits : `+${digits}`;
}
