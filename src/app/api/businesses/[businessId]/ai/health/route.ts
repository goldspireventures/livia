import { type NextRequest } from "next/server";

import { requireReaderUserId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { getBusinessHealthInsight } from "@/services/ai/businessHealthInsight";
import { assertUserCanAccessBusiness } from "@/services/business/membershipService";

/**
 * T5 read-only insight. Safe to poll; does not mutate bookings or payments.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const { businessId } = await params;
    const userId = await requireReaderUserId(req);
    await assertUserCanAccessBusiness({ userId, businessId });
    const data = await getBusinessHealthInsight({ businessId, userId });
    return ok(data);
  } catch (err) {
    return handleRouteError(err);
  }
}
