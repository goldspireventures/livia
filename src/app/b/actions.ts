"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { isValidIanaTimeZone } from "@/lib/ianaTimeZone";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { createBusiness } from "@/services/business/businessService";

export async function createBusinessForOwnerAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const name = z.string().min(1).max(120).parse(formData.get("name")?.toString().trim());
  const slugRaw = z.string().min(1).max(80).parse(formData.get("slug")?.toString().trim());
  const tzRaw = formData.get("timezone")?.toString().trim() ?? "";
  const timezone = tzRaw === "" ? undefined : tzRaw;
  if (timezone && !isValidIanaTimeZone(timezone)) {
    return {
      error: "Invalid timezone. Use an IANA id (e.g. Europe/London, America/New_York) or leave blank for UTC.",
    };
  }

  const ownerUserId = await requireOwnerUserId();

  let businessId: string;
  try {
    const business = await createBusiness({
      ownerUserId,
      name,
      slug: slugRaw,
      timezone,
    });
    businessId = business.id;
  } catch (e) {
    if (e instanceof AppError) {
      return { error: e.message };
    }
    throw e;
  }

  revalidatePath("/b");
  redirect(`/b/${businessId}/bookings`);
}
