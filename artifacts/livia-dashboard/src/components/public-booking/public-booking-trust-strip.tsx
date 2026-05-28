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
      label: `${policyTrust.lateGraceMinutes} min grace if you're running late`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="mb-6 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-3 space-y-2"
      data-testid="public-booking-trust-strip"
    >
      {chips.map(({ icon: Icon, label }) => (
        <p
          key={label}
          className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" aria-hidden />
          <span>{label}</span>
        </p>
      ))}
    </div>
  );
}
