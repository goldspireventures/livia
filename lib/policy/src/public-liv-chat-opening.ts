/**
 * Public `/b` Liv chat — one opening bubble: regulatory disclosure + optional tenant warmth.
 * Strips redundant "Hi I'm Liv…" when disclosure already introduced Liv.
 */

/** Remove a leading Liv self-intro sentence; returns null if nothing actionable remains. */
export function stripRedundantLivIntro(greeting: string): string | null {
  let g = greeting.trim();
  if (!g) return null;

  const introPatterns = [
    /^hi[!,.\s]+(?:I['']?m\s+)?Liv\b[^.?!]*[.?!]\s*/i,
    /^hi[!,.\s—-]+(?:I['']?m\s+)?(?:the\s+)?(?:AI\s+)?assistant\s+for\b[^.?!]*[.?!]\s*/i,
  ];

  let prev = "";
  while (prev !== g) {
    prev = g;
    for (const pattern of introPatterns) {
      g = g.replace(pattern, "").trim();
    }
  }

  if (!g || (/^hi\b/i.test(g) && /\bLiv\b/i.test(g))) return null;
  return g;
}

export function mergePublicLivChatOpening(
  disclosureMessage: string,
  greeting?: string | null,
): string {
  const trimmed = greeting?.trim();
  if (!trimmed) return disclosureMessage;

  const tail = stripRedundantLivIntro(trimmed);
  if (tail === null) return disclosureMessage;
  if (tail === trimmed) return `${disclosureMessage}\n\n${trimmed}`;
  return `${disclosureMessage}\n\n${tail}`;
}
