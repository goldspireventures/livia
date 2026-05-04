import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Bliq
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Appointments for service businesses. Use the dashboard to manage your business, or open a
          public booking link when you have one.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/b"
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Business workspace
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
