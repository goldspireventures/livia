import { Star } from "lucide-react";

export type PublicSocialProof = {
  rating: number;
  reviewCount: number;
  highlights: string[];
};

/** Quote highlights only — rating shown inline in the booking header. */
export function PublicSocialProofStrip({
  proof,
  variant = "quotes",
}: {
  proof?: PublicSocialProof | null;
  /** full = stars + quotes (legacy); quotes = highlights only */
  variant?: "full" | "quotes";
}) {
  if (!proof || proof.reviewCount <= 0 || !proof.highlights.length) return null;

  if (variant === "full") {
    return (
      <section
        className="mb-4 rounded-xl border border-border/60 bg-card/50 p-4"
        aria-label="Customer reviews"
        data-testid="public-social-proof"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < Math.round(proof.rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
              />
            ))}
          </div>
          <p className="text-sm font-medium">
            {proof.rating.toFixed(1)}{" "}
            <span className="text-muted-foreground font-normal">
              · {proof.reviewCount}+ happy clients
            </span>
          </p>
        </div>
        <ul className="space-y-2">
          {proof.highlights.slice(0, 2).map((line) => (
            <li key={line} className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/30">
              “{line}”
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      className="mt-4 pt-3 border-t border-border/40"
      aria-label="What clients say"
      data-testid="public-social-proof"
    >
      <ul className="space-y-1.5">
        {proof.highlights.slice(0, 2).map((line) => (
          <li key={line} className="text-[11px] text-muted-foreground leading-relaxed italic">
            “{line}”
          </li>
        ))}
      </ul>
    </section>
  );
}
