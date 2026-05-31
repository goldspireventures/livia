import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/business-context";

/** Full-page guided booking — notes, full client search, every step visible. */
export default function BookingNewPage() {
  const { business } = useBusiness();

  return (
    <OperationalPageShell
      data-testid="booking-new-page"
      title="New booking"
      subtitle={`Guided flow · ${business?.name ?? "your shop"} — client, service, team, time, then confirm.`}
      width="lg"
      actions={
        <Link href="/bookings">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to list
          </Button>
        </Link>
      }
    >
      <BookingWizard mode="page" quick={false} />
    </OperationalPageShell>
  );
}
