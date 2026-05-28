import { z } from "zod/v4";

export const businessStructureKindSchema = z.enum(["standalone", "location", "brand_entity"]);
export type BusinessStructureKind = z.infer<typeof businessStructureKindSchema>;

export function defaultStructureKindForCreate(args: {
  parentBusinessId?: string | null;
  intentSecondShop?: boolean;
}): BusinessStructureKind {
  if (args.parentBusinessId) return "location";
  if (args.intentSecondShop) return "location";
  return "standalone";
}
