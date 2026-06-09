import { PageFrame } from "@/components/ui/page-frame";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { cn } from "@/lib/utils";
import { verticalToneClass } from "@/lib/motion";
import { useBusiness } from "@/lib/business-context";
import { useBeautyChrome, useWellnessChrome, isConstellationPresentation } from "@/lib/presentation-layout";

type Props = {
  title: string;
  subtitle?: string;
  /** Primary actions — keep to 1–3 controls (fingertip zone). */
  actions?: React.ReactNode;
  children: React.ReactNode;
  width?: "md" | "lg" | "full";
  className?: string;
  "data-testid"?: string;
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
  "data-testid": testId,
  tone = true,
}: Props) {
  const { business } = useBusiness();
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const beautyChrome = useBeautyChrome(vertical);
  const wellnessChrome = useWellnessChrome(vertical);
  const constellationChrome =
    !beautyChrome && !wellnessChrome && isConstellationPresentation();
  /** Native presentation presets own --primary; v3 tone-* classes would override with purple. */
  const applyVerticalTone =
    tone && vertical && !beautyChrome && !wellnessChrome && !constellationChrome
      ? verticalToneClass(vertical)
      : undefined;

  return (
    <PageFrame
      width={width}
      className={cn(
        applyVerticalTone,
        beautyChrome && "beauty-operational-page",
        wellnessChrome && "wellness-operational-page",
        constellationChrome && "constellation-operational-page",
        className,
      )}
      data-testid={testId}
    >
      <PersonaRitualHeader variant="page" title={title} subtitle={subtitle}>
        {actions}
      </PersonaRitualHeader>
      {children}
    </PageFrame>
  );
}
