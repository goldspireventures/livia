"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  basePriceMinorUnits: number | null;
  currency: string | null;
};

type Overview = {
  name: string;
  slug: string;
  timezone: string;
  services: Service[];
};

type Slot = { startsAt: string; endsAt: string; staffId: string };

export function BookSlugClient() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selected, setSelected] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const fetchSlotsData = useCallback(async (): Promise<Slot[]> => {
    const q = new URLSearchParams({ serviceId, date });
    const res = await fetch(`/api/public/businesses/${encodeURIComponent(slug)}/slots?${q}`);
    const json = (await res.json()) as { ok?: boolean; data?: Slot[]; error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message ?? res.statusText);
    return Array.isArray(json.data) ? json.data : [];
  }, [slug, serviceId, date]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/businesses/${encodeURIComponent(slug)}`);
        const json = (await res.json()) as {
          ok?: boolean;
          data?: Overview;
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(json.error?.message ?? res.statusText);
        if (!json.data) throw new Error("Invalid response");
        if (!cancelled) {
          setOverview(json.data);
          const first = json.data.services[0]?.id ?? "";
          setServiceId(first);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load business");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!overview || !serviceId || !date) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setSlotsLoading(true);
      const res = await fetch(
        `/api/public/businesses/${encodeURIComponent(slug)}/slots?${new URLSearchParams({ serviceId, date })}`,
      );
      if (cancelled) return;
      const json = (await res.json()) as { ok?: boolean; data?: Slot[]; error?: { message?: string } };
      if (!res.ok) {
        setError(json.error?.message ?? res.statusText);
        setSlots([]);
        setSelected(null);
        setSlotsLoading(false);
        return;
      }
      setSlots(Array.isArray(json.data) ? json.data : []);
      setSelected(null);
      setSlotsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [overview, serviceId, date, slug]);

  const canSubmit = useMemo(
    () => Boolean(selected && customerName.trim() && customerEmail.includes("@")),
    [selected, customerName, customerEmail],
  );

  async function submitBooking() {
    if (!selected || !canSubmit) return;
    setSubmitting(true);
    setDoneMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/public/businesses/${encodeURIComponent(slug)}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          staffId: selected.staffId,
          startsAt: selected.startsAt,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? res.statusText);
      setDoneMessage("Booking requested. The business will confirm it.");
      setSelected(null);
      const next = await fetchSlotsData();
      setSlots(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !overview) {
    return <p className="p-6 text-sm text-red-600">{error}</p>;
  }
  if (!overview) {
    return <p className="p-6 text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <main className="mx-auto max-w-lg flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{overview.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Timezone: {overview.timezone}</p>
      </div>

      {overview.services.length === 0 ? (
        <p className="text-sm text-zinc-600">No bookable services yet.</p>
      ) : (
        <>
          <label className="block text-sm font-medium">
            Service
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              {overview.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes} min)
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <div>
            <div className="text-sm font-medium">Available times</div>
            {slotsLoading ? (
              <p className="mt-2 text-sm text-zinc-500">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">No open slots for this day (add staff, rules, and assignments).</p>
            ) : (
              <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                {slots.map((s) => (
                  <li key={`${s.startsAt}-${s.staffId}`}>
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className={`w-full rounded px-2 py-1.5 text-left text-sm ${
                        selected?.startsAt === s.startsAt && selected?.staffId === s.staffId
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {new Date(s.startsAt).toLocaleString(undefined, {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      <span className="text-zinc-500">· staff {s.staffId.slice(0, 8)}…</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="block text-sm font-medium">
            Your name
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {doneMessage ? <p className="text-sm text-green-700 dark:text-green-400">{doneMessage}</p> : null}

          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => void submitBooking()}
            className="w-full rounded-md bg-zinc-900 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {submitting ? "Booking…" : "Book"}
          </button>
        </>
      )}
    </main>
  );
}
