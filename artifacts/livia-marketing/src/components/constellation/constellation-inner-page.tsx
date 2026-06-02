import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ConstellationInnerPageProps = {
  children: ReactNode;
  /** Narrow prose column (~40rem). Default for editorial inner pages. */
  narrow?: boolean;
  /** Wide content column (~72rem). Grids and index layouts. */
  wide?: boolean;
  className?: string;
};

export function ConstellationInnerPage({ children, narrow, wide, className }: ConstellationInnerPageProps) {
  return (
    <div
      className={cn(
        "cst-inner-page",
        narrow && "cst-inner-page--narrow",
        wide && "cst-inner-page--wide",
        !narrow && !wide && "cst-inner-page--default",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ConstellationPainList({ items }: { items: string[] }) {
  return (
    <ul className="cst-pain-list">
      {items.map((item) => (
        <li key={item} className="cst-pain-list__item">
          <span className="cst-pain-list__dot" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ConstellationPageFooter({ children }: { children: ReactNode }) {
  return <div className="cst-page-footer">{children}</div>;
}
