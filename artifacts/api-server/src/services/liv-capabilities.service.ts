import { listRegisteredTools } from "@workspace/liv-runtime";
import { getCachedTenantRuntime } from "../lib/tenant-runtime-pool";
import { loadVerticalPack } from "@workspace/liv-runtime";
import { resolveLivToolsForBusiness } from "./liv-tool-catalog.service";

export async function getLivCapabilitiesForBusiness(
  businessId: string,
  profile: "tenant_public" | "tenant_staff",
) {
  const cached = await getCachedTenantRuntime(businessId);
  if (!cached) return null;

  const canBookDirectly = (cached.business.aiCanBookDirectly ?? "true") === "true";
  const pack = loadVerticalPack(cached.business.vertical, cached.packConfig);

  const tools = await resolveLivToolsForBusiness(businessId, {
    profile,
    canBookDirectly,
    extraToolIds: pack.extraToolIds,
  });

  return {
    businessId,
    profile,
    aiEnabled: cached.business.aiEnabled !== "false",
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
    })),
    catalogSize: listRegisteredTools().length,
  };
}
