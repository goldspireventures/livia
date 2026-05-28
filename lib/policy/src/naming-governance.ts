import { z } from "zod/v4";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "www",
  "liv",
  "livia",
  "support",
  "help",
  "demo",
  "public",
  "internal",
  "health",
  "onboarding",
]);

export const businessSlugSchema = z
  .string()
  .min(2)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const businessNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be at most 80 characters");

export type NamingValidationResult =
  | { ok: true }
  | { ok: false; field: "name" | "slug"; message: string };

export function validateBusinessNaming(args: {
  name: string;
  slug: string;
  structureKind?: "standalone" | "location" | "brand_entity";
  parentBusinessName?: string | null;
}): NamingValidationResult {
  const nameParsed = businessNameSchema.safeParse(args.name);
  if (!nameParsed.success) {
    return { ok: false, field: "name", message: nameParsed.error.issues[0]?.message ?? "Invalid name" };
  }

  const slugParsed = businessSlugSchema.safeParse(args.slug);
  if (!slugParsed.success) {
    return { ok: false, field: "slug", message: slugParsed.error.issues[0]?.message ?? "Invalid slug" };
  }

  if (RESERVED_SLUGS.has(args.slug)) {
    return { ok: false, field: "slug", message: "This slug is reserved" };
  }

  if (args.structureKind === "location" && args.parentBusinessName) {
    const parent = args.parentBusinessName.trim().toLowerCase();
    const child = nameParsed.data.trim().toLowerCase();
    if (parent === child) {
      return {
        ok: false,
        field: "name",
        message: "Location name should differ from the parent brand name",
      };
    }
  }

  return { ok: true };
}
