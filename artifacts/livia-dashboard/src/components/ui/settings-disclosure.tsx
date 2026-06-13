import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
};

/** Lightweight collapsible — title only; never use description for UI mechanics (see policy event-vendor-quote-program). */
export function SettingsDisclosure({
  id,
  title,
  description,
  defaultOpen = false,
  children,
  className,
  "data-testid": dataTestId,
}: Props) {
  return (
    <details
      id={id}
      data-testid={dataTestId}
      className={cn(
        "group rounded-xl border border-border bg-card/40 overflow-hidden",
        className,
      )}
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          ) : null}
        </div>
      </summary>
      <div className="px-4 pb-4 pt-0 border-t border-border/60">{children}</div>
    </details>
  );
}
