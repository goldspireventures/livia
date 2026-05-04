import { type NextRequest } from "next/server";

import { requireReaderUserId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import { assertUserCanAccessBusiness } from "@/services/business/membershipService";
import { listStaffForService } from "@/services/catalog/staffServiceAssignmentService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; serviceId: string }> },
) {
  try {
    const { businessId, serviceId } = await params;
    const userId = await requireReaderUserId(req);

    await assertUserCanAccessBusiness({ userId, businessId });
    const rows = await listStaffForService({ businessId, serviceId });
    return ok(rows);
  } catch (err) {
    return handleRouteError(err);
  }
}
