import { z } from "zod";

import { created, handleRouteError } from "@/lib/http";
import { publicRateLimitExceeded } from "@/lib/publicRateLimit";
import { createPublicBooking } from "@/services/booking/publicBookingService";

const Body = z.object({
  serviceId: z.string().min(1).max(64),
  staffId: z.string().min(1).max(64),
  startsAt: z.coerce.date(),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email().max(320),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const limited = publicRateLimitExceeded(req);
    if (limited) return limited;

    const contentLengthRaw = req.headers.get("content-length");
    if (contentLengthRaw) {
      const n = Number(contentLengthRaw);
      if (Number.isFinite(n) && n > 20_000) {
        return new Response("Payload too large.", { status: 413 });
      }
    }

    const { slug } = await params;
    const body = Body.parse(await req.json());
    const booking = await createPublicBooking({
      businessSlug: slug,
      ...body,
    });
    return created(booking);
  } catch (err) {
    return handleRouteError(err);
  }
}
