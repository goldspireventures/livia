import {
  notificationPrefsSchema,
  parseNotificationPrefs,
  type NotificationPrefs,
} from "@workspace/policy";
import { getBusinessById, updateBusiness } from "./businesses.service";

export async function getNotificationPreferences(businessId: string) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  return {
    preferences: parseNotificationPrefs(biz.operationalPolicy),
    pushConfigured: Boolean(process.env["EXPO_ACCESS_TOKEN"] || true),
  };
}

export async function patchNotificationPreferences(
  businessId: string,
  partial: Partial<NotificationPrefs>,
) {
  const biz = await getBusinessById(businessId);
  if (!biz) return null;
  const current = parseNotificationPrefs(biz.operationalPolicy);
  const preferences = notificationPrefsSchema.parse({ ...current, ...partial });
  const raw =
    biz.operationalPolicy && typeof biz.operationalPolicy === "object"
      ? { ...(biz.operationalPolicy as Record<string, unknown>) }
      : {};
  await updateBusiness(businessId, {
    operationalPolicy: { ...raw, notifications: preferences } as Record<string, unknown>,
  });
  return getNotificationPreferences(businessId);
}
