import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { CustomerTimeline } from "@/components/customer-timeline";
import { ownerClientHistoryCopy } from "@workspace/policy";

type BookingRow = {
  id: string;
  status: string;
  startAt: string;
  service?: { name?: string } | null;
};

export function GuestHistoryPanel({
  businessId,
  customerId,
  recentBookings,
  vertical,
}: {
  businessId: string;
  customerId: string;
  recentBookings?: BookingRow[];
  vertical?: string | null;
}) {
  const bookings = recentBookings ?? [];
  const copy = ownerClientHistoryCopy(vertical);
  const summary =
    bookings.length > 0
      ? `${bookings.length} visit${bookings.length === 1 ? "" : "s"} and messages — newest first`
      : copy.emptyDescription;

  return (
    <SettingsDisclosure
      title={copy.title}
      description={summary}
      defaultOpen={bookings.length > 0}
      data-testid="guest-history-panel"
    >
      <div className="pt-1">
        <CustomerTimeline
          businessId={businessId}
          customerId={customerId}
          embedded
          recentBookings={bookings}
        />
      </div>
    </SettingsDisclosure>
  );
}
