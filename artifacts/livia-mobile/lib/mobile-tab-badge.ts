/** Cap tab badges so founder setup noise does not show double-digit counts. */
export function formatMobileTabBadge(count: number | undefined): number | undefined {
  if (count == null || count <= 0) return undefined;
  return Math.min(count, 9);
}
