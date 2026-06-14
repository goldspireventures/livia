import { cn } from "@/lib/utils";
import type { PublicBookSectionId } from "@workspace/policy";
import { publicBookSectionLabels } from "@workspace/policy";

const SECTION_TARGETS: Record<PublicBookSectionId, string> = {
  treatments: "public-book-treatments",
  team: "public-book-team",
  shop: "public-book-shop",
};

export function PublicBookSectionNav({
  sections,
  counts,
  vertical,
  className,
}: {
  sections: PublicBookSectionId[];
  counts?: Partial<Record<PublicBookSectionId, number>>;
  vertical?: string | null;
  className?: string;
}) {
  if (sections.length < 2) return null;

  const labels = publicBookSectionLabels(vertical);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Book page sections"
      className={cn(
        "sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2",
        "bg-background/90 backdrop-blur-md border-b border-border/60",
        className,
      )}
      data-testid="public-book-section-nav"
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {sections.map((section) => {
          const targetId = SECTION_TARGETS[section];
          const count = counts?.[section];
          return (
            <button
              key={section}
              type="button"
              onClick={() => scrollTo(targetId)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                "border-border/80 bg-card/60 hover:border-primary/40 hover:bg-primary/5",
              )}
              data-testid={`public-book-nav-${section}`}
            >
              {labels[section]}
              {count != null && count > 0 ? (
                <span className="ml-1.5 tabular-nums text-muted-foreground">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
