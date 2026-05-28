import { useMemo } from "react";
import { useBusiness } from "@/lib/business-context";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { Sparkles } from "lucide-react";

/** Subtle vertical context in app chrome — honest, not over-marketed. */
export function VerticalPackBanner() {
  const { business } = useBusiness();
  const pack = useMemo(
    () => verticalPackUi((business as { vertical?: string } | null)?.vertical),
    [business],
  );

  if (!pack?.label) return null;

  return (
    <div
      className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground border rounded-md px-2 py-1 bg-muted/40"
      data-testid="vertical-pack-banner"
      title={pack.hint}
    >
      <Sparkles className="h-3 w-3 text-primary/70" />
      <span>{pack.label}</span>
      {pack.hint ? <span className="text-muted-foreground/80 truncate max-w-[200px]">· {pack.hint}</span> : null}
    </div>
  );
}
