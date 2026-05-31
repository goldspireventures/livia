/** WCAG contrast hint for owner-picked accent on light `/b` backgrounds. */

function srgbChannel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const m = /^#([0-9A-Fa-f]{6})$/.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1]!, 16);
  const r = srgbChannel((n >> 16) & 255);
  const g = srgbChannel((n >> 8) & 255);
  const b = srgbChannel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function accentContrastRatio(hex: string, against = "#ffffff"): number {
  const m = /^#([0-9A-Fa-f]{6})$/.exec(against);
  if (!/^#([0-9A-Fa-f]{6})$/.test(hex) || !m) return 0;
  const l1 = relativeLuminance(hex);
  const l2 = relativeLuminance(against);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function accentMeetsWcagAa(hex: string): boolean {
  if (!hex.trim()) return true;
  return accentContrastRatio(hex) >= 4.5;
}
