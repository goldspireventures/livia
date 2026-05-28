import type { ReactNode } from "react";

/** Left-aligned editorial page title — matches livia.io home rhythm. */
export function EditorialPageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="px-4 sm:px-6 py-12 sm:py-16 max-w-3xl">
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.1] mb-4 sm:mb-6">
        {title}
      </h1>
      {subtitle ? (
        <p className="editorial-measure text-muted-foreground text-base sm:text-lg leading-relaxed">{subtitle}</p>
      ) : null}
      {children}
    </header>
  );
}
