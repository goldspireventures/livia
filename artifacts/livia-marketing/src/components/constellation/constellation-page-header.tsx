import type { ReactNode } from "react";

type ConstellationPageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function ConstellationPageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: ConstellationPageHeaderProps) {
  return (
    <header className={`cst-page-header max-w-6xl mx-auto ${className}`}>
      {eyebrow ? <p className="cst-page-header__eyebrow">{eyebrow}</p> : null}
      <h1 className="cst-page-header__title">{title}</h1>
      {subtitle ? <p className="cst-page-header__sub">{subtitle}</p> : null}
      {children}
    </header>
  );
}
