"use client";

import { useActionState } from "react";

import { createBusinessForOwnerAction } from "./actions";

export function CreateBusinessForm({ id }: { id?: string }) {
  const [state, formAction, pending] = useActionState(createBusinessForOwnerAction, null);

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900" id={id}>
      <div>
        <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Create a business</h2>
        <p className="mt-1 text-xs text-zinc-500">
          You will be the owner. Slug is used in URLs (letters, numbers, hyphens); it must be unique.
        </p>
      </div>
      {state?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="cb-name" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Name
        </label>
        <input
          id="cb-name"
          name="name"
          required
          maxLength={120}
          placeholder="My Studio"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="cb-slug" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Slug
        </label>
        <input
          id="cb-slug"
          name="slug"
          required
          maxLength={80}
          placeholder="my-studio"
          pattern="[a-zA-Z0-9][a-zA-Z0-9-]*"
          title="Start with a letter or number; hyphens allowed."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="cb-tz" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Timezone <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input
          id="cb-tz"
          name="timezone"
          maxLength={80}
          placeholder="Europe/London"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          list="iana-timezones"
        />
        <datalist id="iana-timezones">
          <option value="UTC" />
          <option value="Europe/London" />
          <option value="Europe/Paris" />
          <option value="America/New_York" />
          <option value="America/Chicago" />
          <option value="America/Denver" />
          <option value="America/Los_Angeles" />
          <option value="Australia/Sydney" />
        </datalist>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Creating…" : "Create business"}
      </button>
    </form>
  );
}
