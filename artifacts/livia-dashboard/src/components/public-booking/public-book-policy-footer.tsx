import type { PublicPolicyTrust } from "@/lib/public-booking-helpers";

/** Jurisdiction cancel/deposit line — no Livia wordmark (screen card w5.public.book). */
export function PublicBookPolicyFooter({
  depositPolicySummary,
  policyTrust,
  regulatoryFooter,
}: {
  depositPolicySummary?: string | null;
  policyTrust?: PublicPolicyTrust | null;
  regulatoryFooter?: string[];
}) {
  const lines: string[] = [];
  if (depositPolicySummary?.trim()) {
    lines.push(depositPolicySummary.trim());
  } else if (policyTrust?.depositRequired) {
    lines.push("A deposit may be required to confirm your booking.");
  }
  if (policyTrust && policyTrust.cancelWindowHours > 0) {
    lines.push(
      `Free cancellation up to ${policyTrust.cancelWindowHours} hours before your appointment.`,
    );
  }
  for (const line of regulatoryFooter ?? []) {
    if (line.trim()) lines.push(line.trim());
  }

  if (lines.length === 0) return null;

  return (
    <footer className="mt-10 pt-6 pb-24 border-t border-border/30" data-testid="public-book-policy-footer">
      {lines.map((line) => (
        <p key={line} className="text-xs text-muted-foreground leading-relaxed">
          {line}
        </p>
      ))}
    </footer>
  );
}
