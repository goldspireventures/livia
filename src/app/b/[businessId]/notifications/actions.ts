"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserCanAccessBusiness } from "@/services/business/membershipService";
import { markInAppNotificationRead } from "@/services/notifications/inAppNotificationService";

export async function markInAppNotificationReadInBusinessAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const notificationId = z.string().min(1).parse(formData.get("notificationId")?.toString());

  const userId = await requireOwnerUserId();
  await assertUserCanAccessBusiness({
    userId,
    businessId,
    options: { emitAccessChecked: false },
  });

  await markInAppNotificationRead({ userId, id: notificationId, businessId });

  revalidatePath(`/b/${businessId}/notifications`);
  revalidatePath(`/b/${businessId}`);
}
