import { ShieldCheck, Clock, CreditCard } from "lucide-react";
import type { PublicPolicyTrust } from "@/lib/public-booking-helpers";

export function PublicBookingTrustStrip({
  depositPolicySummary,
  policyTrust,
}: {
  depositPolicySummary?: string | null;
  policyTrust?: PublicPolicyTrust | null;
}) {
  const chips: { icon: typeof ShieldCheck; label: string }[] = [];

  if (depositPolicySummary?.trim()) {
    chips.push({ icon: CreditCard, label: depositPolicySummary.trim() });
  } else if (policyTrust?.depositRequired) {
    chips.push({ icon: CreditCard, label: "Deposit required to confirm online" });
  }

  if (policyTrust?.cancelWindowHours != null && policyTrust.cancelWindowHours > 0) {
    chips.push({
      icon: ShieldCheck,
      label: `Free cancel up to ${policyTrust.cancelWindowHours}h before`,
    });
  }

  if (policyTrust?.lateGraceMinutes != null && policyTrust.lateGraceMinutes > 0) {
    chips.push({
      icon: Clock,
      label: `${policyTrust.lateGraceMinutes} min grace if late`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="mb-4 flex flex-wrap gap-2"
      data-testid="public-booking-trust-strip"
    >
      {chips.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground"
        >
          <Icon className="h-3 w-3 shrink-0 text-primary" aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
