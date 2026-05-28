import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";
import type { OnboardingActId } from "@/lib/onboarding-acts";

type Service = { id: string; name: string; durationMinutes: number };
type Staff = { id: string; displayName: string; isActive: boolean };

export function OnboardingInlinePanel({
  act,
  businessId,
}: {
  act: OnboardingActId;
  businessId: string;
}) {
  const [services, setServices] = useState<Service[] | null>(null);
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    if (act === "a3_service_menu") {
      setLoading(true);
      apiFetch<Service[]>(`/businesses/${businessId}/services`)
        .then(setServices)
        .catch(() => setServices([]))
        .finally(() => setLoading(false));
    }
    if (act === "a4_team") {
      setLoading(true);
      apiFetch<Staff[]>(`/businesses/${businessId}/staff`)
        .then(setStaff)
        .catch(() => setStaff([]))
        .finally(() => setLoading(false));
    }
  }, [act, businessId]);

  if (act === "a3_service_menu") {
    if (loading) return <Skeleton className="h-24 w-full" />;
    return (
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2" data-testid="onboarding-services-preview">
        <p className="text-sm font-medium">Seeded services ({services?.length ?? 0})</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          {(services ?? []).slice(0, 5).map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <Check className="h-3 w-3 text-primary" />
              {s.name} · {s.durationMinutes} min
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" asChild>
          <Link href="/services">Edit full menu</Link>
        </Button>
      </div>
    );
  }

  if (act === "a4_team") {
    if (loading) return <Skeleton className="h-24 w-full" />;
    return (
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2" data-testid="onboarding-staff-preview">
        <p className="text-sm font-medium">Team ({staff?.length ?? 0})</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          {(staff ?? []).map((s) => (
            <li key={s.id}>{s.displayName}</li>
          ))}
        </ul>
        <Button variant="outline" size="sm" asChild>
          <Link href="/staff">Manage team</Link>
        </Button>
      </div>
    );
  }

  if (act === "a9_billing") {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Closed beta is free. You can lock in Solo / Studio / Chain pricing before public launch in{" "}
        <Link href="/settings" className="text-primary underline">
          Settings → Billing
        </Link>
        .
      </div>
    );
  }

  return null;
}
