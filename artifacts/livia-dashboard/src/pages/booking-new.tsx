import { BookingWizard } from "@/components/booking/booking-wizard";

/** Full-page booking flow — dialog on `/bookings` stays for quick add. */
export default function BookingNewPage() {
  return <BookingWizard mode="page" />;
}
