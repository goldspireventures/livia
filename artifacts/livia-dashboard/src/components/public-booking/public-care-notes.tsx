import { Sparkles } from "lucide-react";
import { publicCareNotes } from "@/lib/public-booking-helpers";

export function PublicCareNotes({ vertical }: { vertical?: string | null }) {
  const notes = publicCareNotes(vertical);
  if (!notes.length) return null;

  return (
    <section
      className="mb-6 rounded-xl border border-primary/15 bg-primary/5 p-4"
      aria-labelledby="public-care-heading"
      data-testid="public-booking-care-notes"
    >
      <h2
        id="public-care-heading"
        className="text-sm font-medium flex items-center gap-2 mb-2"
      >
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        Before you book
      </h2>
      <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc pl-5">
        {notes.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
