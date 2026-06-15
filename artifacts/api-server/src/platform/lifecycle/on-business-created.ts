/**
 * Platform lifecycle — tenant birth + mutation fan-out (resolve clock).
 * @see docs/engineering/PROPAGATION-PROGRAM.md
 */
import type { BusinessVertical } from "@workspace/policy";
import { compileVerticalManifest } from "@workspace/policy";

export type BusinessCreatedContext = {
  businessId: string;
  ownerId: string;
  vertical: BusinessVertical;
  slug: string;
  name: string;
};

export type BusinessCreatedOptions = {
  starterPack?: boolean;
  seedDefaults?: boolean;
};

export type PropagationLifecycleReceipt = {
  ingress: "tenant.birth" | "tenant.mutation";
  businessId: string;
  vertical: BusinessVertical;
  capabilityIds: string[];
  demoSlug: string | null;
  fanOut: string[];
  cleared: boolean;
};

export type BusinessCreatedResult = {
  receipt: PropagationLifecycleReceipt;
};

export type TenantMutationContext = {
  businessId: string;
  verticalBefore: BusinessVertical | null;
  verticalAfter: BusinessVertical | null;
  presetBefore: string | null;
  presetAfter: string | null;
};

export type TenantMutationResult = {
  receipt: PropagationLifecycleReceipt;
  bundleInvalidated: boolean;
};

/** Resolve-clock clearance + fan-out plan for a new tenant. */
export function planBusinessCreatedPropagation(
  ctx: BusinessCreatedContext,
): PropagationLifecycleReceipt {
  const manifest = compileVerticalManifest(ctx.vertical);
  const cleared = manifest.clearance.announcement.ok && manifest.clearance.copy.ok;
  const fanOut = [
    "tenant.membership.owner",
    "tenant.onboarding.state",
    "tenant.experience.bundle",
    "tenant.public.slug",
  ];
  if (manifest.demoSlug) fanOut.push("demo.registry.slug");
  return {
    ingress: "tenant.birth",
    businessId: ctx.businessId,
    vertical: ctx.vertical,
    capabilityIds: manifest.capabilityIds,
    demoSlug: manifest.demoSlug,
    fanOut,
    cleared,
  };
}

export async function onBusinessCreated(
  ctx: BusinessCreatedContext,
  options: BusinessCreatedOptions,
  hooks: {
    seedStarterPack?: (businessId: string) => Promise<void>;
    seedOnboardingPack?: (businessId: string) => Promise<void>;
  } = {},
): Promise<BusinessCreatedResult> {
  const receipt = planBusinessCreatedPropagation(ctx);

  if (options.starterPack && hooks.seedStarterPack) {
    await hooks.seedStarterPack(ctx.businessId);
    receipt.fanOut.push("seed.vertical_starter_pack");
  } else if (options.seedDefaults && hooks.seedOnboardingPack) {
    await hooks.seedOnboardingPack(ctx.businessId);
    receipt.fanOut.push("seed.onboarding_pack");
  }

  return { receipt };
}

export function planTenantMutationPropagation(
  ctx: TenantMutationContext,
): TenantMutationResult {
  const vertical = ctx.verticalAfter ?? ctx.verticalBefore ?? "hair";
  const manifest = compileVerticalManifest(vertical);
  const verticalChanged =
    ctx.verticalBefore != null &&
    ctx.verticalAfter != null &&
    ctx.verticalBefore !== ctx.verticalAfter;
  const presetChanged =
    ctx.presetBefore != null &&
    ctx.presetAfter != null &&
    ctx.presetBefore !== ctx.presetAfter;
  const bundleInvalidated = verticalChanged || presetChanged;

  const fanOut = ["tenant.experience.bundle"];
  if (verticalChanged) {
    fanOut.push("tenant.vocabulary", "tenant.announcement", "tenant.onboarding.extras");
  }
  if (presetChanged) {
    fanOut.push("tenant.presentation.skin");
  }

  return {
    bundleInvalidated,
    receipt: {
      ingress: "tenant.mutation",
      businessId: ctx.businessId,
      vertical,
      capabilityIds: manifest.capabilityIds,
      demoSlug: manifest.demoSlug,
      fanOut,
      cleared: manifest.clearance.announcement.ok,
    },
  };
}

export async function onTenantMutation(
  ctx: TenantMutationContext,
  hooks: { invalidateTenantExperienceCache?: (businessId: string) => void } = {},
): Promise<TenantMutationResult> {
  const result = planTenantMutationPropagation(ctx);
  if (result.bundleInvalidated && hooks.invalidateTenantExperienceCache) {
    hooks.invalidateTenantExperienceCache(ctx.businessId);
  }
  return result;
}
