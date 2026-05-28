import { PageFrame } from "@/components/ui/page-frame";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { cn } from "@/lib/utils";
import { verticalToneClass } from "@/lib/motion";
import { useBusiness } from "@/lib/business-context";

type Props = {
  title: string;
  subtitle?: string;
  /** Primary actions — keep to 1–3 controls (fingertip zone). */
  actions?: React.ReactNode;
  children: React.ReactNode;
  width?: "md" | "lg" | "full";
  className?: string;
  /** Subtle vertical accent on the page background */
  tone?: boolean;
};

/**
 * Standard operator page: motion + width + ritual header + optional vertical tone.
 * Prefer this over ad-hoc h1 blocks so every screen feels cohesive.
 */
export function OperationalPageShell({
  title,
  subtitle,
  actions,
  children,
  width = "full",
  className,
  tone = true,
}: Props) {
  const { business } = useBusiness();
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const toneClass = tone && vertical ? verticalToneClass(vertical) : undefined;

  return (
    <PageFrame width={width} className={cn(toneClass, className)}>
      <PersonaRitualHeader variant="page" title={title} subtitle={subtitle}>
        {actions}
      </PersonaRitualHeader>
      {children}
    </PageFrame>
  );
}
