"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwnerUserId } from "@/lib/ownerSession";
import { assertUserRole } from "@/services/business/membershipService";
import { createService, updateService } from "@/services/catalog/serviceCatalogService";

function optionalTrimmed(raw: unknown): string | null {
  const s = raw?.toString() ?? "";
  return s.trim() === "" ? null : s.trim();
}

function optionalImageUrl(raw: unknown): string | null {
  const s = raw?.toString().trim() ?? "";
  if (s === "") return null;
  return z.string().url().parse(s);
}

function optionalPriceMinor(raw: unknown): number | null {
  const s = raw?.toString().trim() ?? "";
  if (s === "") return null;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Invalid price");
  }
  return Math.round(n * 100);
}

export async function createServiceAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const name = z.string().min(1).parse(formData.get("name")?.toString().trim());
  const durationMinutes = z.coerce.number().int().positive().parse(formData.get("durationMinutes"));
  const description = optionalTrimmed(formData.get("description"));
  const category = optionalTrimmed(formData.get("category"));
  const currency = z
    .string()
    .length(3)
    .parse((formData.get("currency")?.toString().trim() || "USD").toUpperCase());
  const basePriceMinorUnits = optionalPriceMinor(formData.get("price"));
  const imageUrl = optionalImageUrl(formData.get("imageUrl"));
  const sortRaw = formData.get("sortOrder")?.toString().trim();
  const sortOrder = sortRaw === "" || sortRaw == null ? undefined : z.coerce.number().int().parse(sortRaw);

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  const service = await createService({
    businessId,
    actorUserId: userId,
    name,
    description,
    category,
    durationMinutes,
    basePriceMinorUnits,
    currency,
    imageUrl,
    sortOrder,
    metadata: null,
  });

  revalidatePath(`/b/${businessId}/services`);
  redirect(`/b/${businessId}/services/${service.id}/edit`);
}

export async function updateServiceAction(formData: FormData) {
  const businessId = z.string().min(1).parse(formData.get("businessId")?.toString());
  const serviceId = z.string().min(1).parse(formData.get("serviceId")?.toString());
  const name = z.string().min(1).parse(formData.get("name")?.toString().trim());
  const durationMinutes = z.coerce.number().int().positive().parse(formData.get("durationMinutes"));
  const description = optionalTrimmed(formData.get("description"));
  const category = optionalTrimmed(formData.get("category"));
  const currencyRaw = formData.get("currency")?.toString().trim();
  const currency =
    currencyRaw === "" || currencyRaw == null ? null : z.string().length(3).parse(currencyRaw.toUpperCase());
  const basePriceMinorUnits = optionalPriceMinor(formData.get("price"));
  const imageUrl = optionalImageUrl(formData.get("imageUrl"));
  const sortRaw = formData.get("sortOrder")?.toString().trim();
  const sortOrder = sortRaw === "" || sortRaw == null ? undefined : z.coerce.number().int().parse(sortRaw);
  const active = formData.get("active") === "on";

  const userId = await requireOwnerUserId();
  await assertUserRole({
    userId,
    businessId,
    allowedRoles: ["OWNER", "ADMIN"],
    options: { emitAccessChecked: false },
  });

  await updateService({
    businessId,
    serviceId,
    actorUserId: userId,
    data: {
      name,
      description,
      category,
      durationMinutes,
      basePriceMinorUnits,
      currency,
      imageUrl,
      active,
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    },
  });

  revalidatePath(`/b/${businessId}/services`);
  revalidatePath(`/b/${businessId}/services/${serviceId}/edit`);
  redirect(`/b/${businessId}/services/${serviceId}/edit`);
}
