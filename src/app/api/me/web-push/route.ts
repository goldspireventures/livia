import { type NextRequest } from "next/server";
import { z } from "zod";

import { requireReaderUserId } from "@/lib/apiIdentity";
import { handleRouteError, ok } from "@/lib/http";
import {
  deleteWebPushSubscription,
  upsertWebPushSubscription,
} from "@/services/notifications/webPushSubscriptionService";

const SubscribeBody = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const DeleteBody = z.object({
  endpoint: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireReaderUserId(req);
    const body = SubscribeBody.parse(await req.json());
    const row = await upsertWebPushSubscription({ userId, ...body });
    return ok({ id: row.id });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireReaderUserId(req);
    const body = DeleteBody.parse(await req.json());
    const result = await deleteWebPushSubscription({ userId, endpoint: body.endpoint });
    return ok(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
