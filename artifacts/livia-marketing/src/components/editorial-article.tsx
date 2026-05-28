import type { ReactNode } from "react";

/** Standard inner-page measure — left-aligned editorial rhythm. */
export function EditorialArticle({
  children,
  wide,
  className = "",
}: {
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto px-4 sm:px-6 pb-20 ${wide ? "max-w-4xl" : "max-w-3xl"} ${className}`}
    >
      {children}
    </div>
  );
}

export function EditorialChapterLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-6 sm:mb-8">
      {children}
    </p>
  );
}

export function EditorialPainList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-4 mb-10 sm:mb-12">
      {items.map((p) => (
        <li key={p} className="border-l-2 border-white/10 pl-4 sm:pl-5 text-muted-foreground leading-relaxed">
          {p}
        </li>
      ))}
    </ul>
  );
}
