import { updateCustomerAction } from "./actions";

type Props = {
  businessId: string;
  customerId: string;
  displayName: string;
  notes: string | null;
};

export function CustomerEditForm({ businessId, customerId, displayName, notes }: Props) {
  return (
    <form action={updateCustomerAction} className="mt-8 max-w-md space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="customerId" value={customerId} />
      <h3 className="text-sm font-semibold">Edit</h3>
      <label className="block text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Display name</span>
        <input
          required
          name="displayName"
          defaultValue={displayName}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={notes ?? ""}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Save changes
      </button>
    </form>
  );
}
