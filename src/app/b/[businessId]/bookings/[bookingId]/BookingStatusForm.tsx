"use client";

import { useFormStatus } from "react-dom";

import { updateBookingStatusAction } from "./actions";

type BookingStatusUi =
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

const STATUSES: BookingStatusUi[] = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {pending ? "Saving…" : "Update status"}
    </button>
  );
}

export function BookingStatusForm({
  businessId,
  bookingId,
  currentStatus,
}: {
  businessId: string;
  bookingId: string;
  currentStatus: BookingStatusUi;
}) {
  return (
    <form action={updateBookingStatusAction} className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Status</span>
        <select
          name="status"
          defaultValue={currentStatus}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton />
    </form>
  );
}
