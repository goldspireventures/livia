/** Masks demo Clerk first names baked into live Today mobile captures. */
export function ShowcaseTodayGreetingFix({ greeting }: { greeting: string }) {
  return (
    <div className="cst-showcase__today-greeting-fix" aria-hidden>
      <span className="cst-showcase__today-greeting-fix__wash" />
      <span className="cst-showcase__today-greeting-fix__text">{greeting}</span>
    </div>
  );
}
