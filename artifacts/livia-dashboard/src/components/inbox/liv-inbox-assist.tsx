import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  STAFF_LIV_HANDOFF_SUGGESTIONS,
  STAFF_LIV_INBOX_SUGGESTIONS,
} from "@/lib/liv-inbox-suggestions";

type Props = {
  disabled?: boolean;
  loading?: boolean;
  mode?: "open" | "handoff";
  onAsk: (prompt: string) => void;
};

export function LivInboxAssist({ disabled, loading, mode = "open", onAsk }: Props) {
  const suggestions =
    mode === "handoff" ? STAFF_LIV_HANDOFF_SUGGESTIONS : STAFF_LIV_INBOX_SUGGESTIONS;

  return (
    <div className="space-y-2" data-testid="liv-inbox-assist">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-primary" />
        Ask Liv
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant="outline"
            className="h-auto py-1 px-2 text-xs font-normal text-left whitespace-normal max-w-full"
            disabled={disabled || loading}
            onClick={() => onAsk(s)}
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}
