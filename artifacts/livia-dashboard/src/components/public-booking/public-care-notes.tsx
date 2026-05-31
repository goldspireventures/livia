import { Sparkles } from "lucide-react";
import { publicCareNotes } from "@/lib/public-booking-helpers";

export function PublicCareNotes({ vertical }: { vertical?: string | null }) {
  const notes = publicCareNotes(vertical);
  if (!notes.length) return null;

  return (
    <details
      className="mb-4 rounded-xl border border-primary/15 bg-primary/5 group"
      open
      data-testid="public-booking-care-notes"
    >
      <summary className="cursor-pointer list-none px-3 py-2.5 flex items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden />
        <span id="public-care-heading">Before you book</span>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-wide text-muted-foreground group-open:hidden">
          Show
        </span>
      </summary>
      <ul className="px-3 pb-3 space-y-1 text-xs text-muted-foreground leading-relaxed list-disc pl-8">
        {notes.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </details>
  );
}
