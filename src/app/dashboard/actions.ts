"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ensureUserForClerk } from "@/services/auth/clerkUserService";
import { markInAppNotificationRead } from "@/services/notifications/inAppNotificationService";

export async function markInAppNotificationReadAction(formData: FormData) {
  const id = z.string().min(1).parse(formData.get("notificationId")?.toString());
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const userId = await ensureUserForClerk({ clerkUserId: clerkId });
  await markInAppNotificationRead({ userId, id });
  revalidatePath("/dashboard");
  revalidatePath("/b", "layout");
}
