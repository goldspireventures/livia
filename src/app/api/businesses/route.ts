import { z } from "zod";

import { resolveOwnerUserIdForCreateBusiness, requireReaderUserId } from "@/lib/apiIdentity";
import { created, handleRouteError, ok } from "@/lib/http";
import { createBusiness } from "@/services/business/businessService";
import { getUserBusinesses } from "@/services/business/membershipService";

const CreateBusinessBody = z.object({
  ownerUserId: z.string().min(1).optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  timezone: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const body = CreateBusinessBody.parse(await req.json());
    const ownerUserId = await resolveOwnerUserIdForCreateBusiness(body);
    const business = await createBusiness({
      ownerUserId,
      name: body.name,
      slug: body.slug,
      timezone: body.timezone,
    });
    return created(business);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET(req: Request) {
  try {
    const userId = await requireReaderUserId(req);
    const businesses = await getUserBusinesses({ userId });
    return ok(businesses);
  } catch (err) {
    return handleRouteError(err);
  }
}
