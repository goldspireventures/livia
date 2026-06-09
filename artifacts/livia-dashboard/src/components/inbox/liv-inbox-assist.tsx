import { ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staffLivInboxSuggestions } from "@workspace/policy";
import { beautyOutlineButton } from "@/lib/beauty-operational-ui";
import { cn } from "@/lib/utils";

type Props = {
  vertical?: string | null;
  category?: string | null;
  disabled?: boolean;
  loading?: boolean;
  mode?: "open" | "handoff";
  beautyChrome?: boolean;
  /** Icon popover — does not eat horizontal compose width. */
  compact?: boolean;
  /** Pinned to the right edge of the thread pane. */
  floating?: boolean;
  extraSuggestions?: readonly string[];
  onAsk: (prompt: string) => void;
};

function SuggestionChips({
  suggestions,
  disabled,
  loading,
  beautyChrome,
  onAsk,
}: {
  suggestions: readonly string[];
  disabled?: boolean;
  loading?: boolean;
  beautyChrome?: boolean;
  onAsk: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((s) => (
        <Button
          key={s}
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "h-auto py-1 px-2 text-xs font-normal text-left whitespace-normal max-w-full",
            beautyOutlineButton(beautyChrome),
          )}
          disabled={disabled || loading}
          onClick={() => onAsk(s)}
        >
          {s}
        </Button>
      ))}
    </div>
  );
}

export function LivInboxAssist({
  vertical,
  category,
  disabled,
  loading,
  mode = "open",
  beautyChrome,
  compact = true,
  floating = false,
  extraSuggestions = [],
  onAsk,
}: Props) {
  const suggestions = [
    ...extraSuggestions,
    ...staffLivInboxSuggestions(vertical, category, mode),
  ].filter((s, i, arr) => arr.indexOf(s) === i).slice(0, 4);

  if (compact) {
    return (
      <details
        className="relative shrink-0 group"
        data-testid="liv-inbox-assist"
      >
        <summary
          className={cn(
            "inline-flex cursor-pointer list-none items-center justify-center border bg-background/80 transition-colors hover:bg-muted/60 [&::-webkit-details-marker]:hidden",
            floating ? "h-10 w-10 rounded-full shadow-md" : "h-9 w-9 rounded-md",
            beautyOutlineButton(beautyChrome),
          )}
          aria-label={`Liv prompts (${suggestions.length})`}
          title={`Liv prompts (${suggestions.length})`}
        >
          <ListChecks className="h-4 w-4 text-primary" />
        </summary>
        <div className="absolute bottom-full right-0 z-30 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-2.5 shadow-lg">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Suggested prompts
          </p>
          <SuggestionChips
            suggestions={suggestions}
            disabled={disabled}
            loading={loading}
            beautyChrome={beautyChrome}
            onAsk={onAsk}
          />
        </div>
      </details>
    );
  }

  return (
    <div className="space-y-2" data-testid="liv-inbox-assist">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-primary" />
        Ask Liv
      </p>
      <SuggestionChips
        suggestions={suggestions}
        disabled={disabled}
        loading={loading}
        beautyChrome={beautyChrome}
        onAsk={onAsk}
      />
    </div>
  );
}
