import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ConstellationSpineProps = {
  steps: { title: string; body: string }[];
};

export function ConstellationSpine({ steps }: ConstellationSpineProps) {
  return (
    <div className="cst-spine max-w-3xl mx-auto px-4 sm:px-6 pb-20">
      {steps.map((step, i) => (
        <article key={step.title} className="cst-spine-step">
          <span className="cst-spine-step__node" aria-hidden />
          <p className="cst-spine-step__index">{String(i + 1).padStart(2, "0")}</p>
          <h2 className="cst-spine-step__title">{step.title}</h2>
          <p className="cst-spine-step__body">{step.body}</p>
        </article>
      ))}
    </div>
  );
}

type ConstellationGlassCardProps = {
  children: ReactNode;
  featured?: boolean;
  className?: string;
};

export function ConstellationGlassCard({ children, featured, className }: ConstellationGlassCardProps) {
  return (
    <div className={cn("cst-glass-card", featured && "cst-glass-card--featured", className)}>{children}</div>
  );
}
