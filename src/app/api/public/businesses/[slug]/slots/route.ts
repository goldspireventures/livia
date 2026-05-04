import { type NextRequest } from "next/server";
import { z } from "zod";

import { handleRouteError, ok } from "@/lib/http";
import { publicRateLimitExceeded } from "@/lib/publicRateLimit";
import { listPublicSlotsForDay } from "@/services/availability/slotService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const limited = publicRateLimitExceeded(req);
    if (limited) return limited;

    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const serviceId = z.string().min(1).parse(searchParams.get("serviceId"));
    const date = z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .parse(searchParams.get("date"));

    const slots = await listPublicSlotsForDay({
      businessSlug: slug,
      serviceId,
      dateStr: date,
    });
    return ok(slots);
  } catch (err) {
    return handleRouteError(err);
  }
}
