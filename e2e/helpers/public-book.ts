import type { APIRequestContext } from "@playwright/test";

export type BookableSlot = {
  serviceId: string;
  startAt: string;
  date: string;
};

const defaultApiBase = () => process.env.E2E_API_BASE ?? "http://127.0.0.1:3000";

/** Scan upcoming days for the first API-reported available slot (avoids E2E races on day+2). */
export async function findAvailablePublicSlot(
  request: APIRequestContext,
  slug: string,
  opts?: { apiBase?: string; startDays?: number; endDays?: number },
): Promise<BookableSlot | null> {
  const apiBase = opts?.apiBase ?? defaultApiBase();
  const bizRes = await request.get(`${apiBase}/api/public/b/${slug}`);
  if (!bizRes.ok()) return null;
  const biz = await bizRes.json();
  const serviceId = biz.services?.[0]?.id as string | undefined;
  if (!serviceId) return null;

  const start = opts?.startDays ?? 7;
  const end = opts?.endDays ?? 20;
  for (let d = start; d <= end; d++) {
    const day = new Date();
    day.setDate(day.getDate() + d);
    const date = day.toISOString().split("T")[0];
    const slotsRes = await request.get(
      `${apiBase}/api/public/b/${slug}/slots?serviceId=${serviceId}&date=${date}`,
    );
    if (!slotsRes.ok()) continue;
    const { slots } = (await slotsRes.json()) as {
      slots?: Array<{ startAt: string; available: boolean }>;
    };
    const slot = slots?.find((s) => s.available);
    if (slot?.startAt) {
      return { serviceId, startAt: slot.startAt, date };
    }
  }
  return null;
}

/** Book with slot retries when another test grabbed the same window. */
export async function bookPublicSlot(
  request: APIRequestContext,
  slug: string,
  customer: Record<string, string>,
  opts?: { apiBase?: string; workerIndex?: number },
) {
  const apiBase = opts?.apiBase ?? defaultApiBase();
  const workerBase = 7 + (opts?.workerIndex ?? 0) * 4;
  let lastRes: Awaited<ReturnType<APIRequestContext["post"]>> | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const found = await findAvailablePublicSlot(request, slug, {
      apiBase,
      startDays: workerBase + attempt * 2,
      endDays: workerBase + 16,
    });
    if (!found) break;
    lastRes = await request.post(`${apiBase}/api/public/b/${slug}/book`, {
      data: {
        serviceId: found.serviceId,
        startAt: found.startAt,
        ...customer,
      },
    });
    if (lastRes.ok()) return lastRes;
    const err = await lastRes.text();
    if (!/no longer available|slot is not/i.test(err)) return lastRes;
  }
  return lastRes;
}
