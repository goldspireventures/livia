import { notFound } from "@/lib/errors";
import { handleRouteError, ok } from "@/lib/http";
import { publicRateLimitExceeded } from "@/lib/publicRateLimit";
import { getPublicBusinessOverview } from "@/services/booking/publicBookingService";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const limited = publicRateLimitExceeded(req);
    if (limited) return limited;

    const { slug } = await params;
    const overview = await getPublicBusinessOverview(slug);
    if (!overview) {
      throw notFound("Business not found.");
    }
    return ok(overview);
  } catch (err) {
    return handleRouteError(err);
  }
}
