/** WCAG 2.4.1 — bypass block (skip to main content). */
export function MarketingSkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="marketing-skip-link">
      Skip to main content
    </a>
  );
}
