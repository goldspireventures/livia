/**
 * Propagation clearance — border control for build + resolve clocks.
 */
import { businessVerticalSchema } from "../types";
import { validateCapabilityRouting } from "./capability-routing";
import { validateSurfaceConsumers } from "./surface-consumers";
import { validateAllVerticalManifests } from "./vertical-manifest";
import { validateAllVerticalCopyPrograms } from "../vertical-copy-program";
import { validateVerticalAnnouncement, PLATFORM_DEFAULT_VERTICAL_ATTRIBUTES } from "../vertical-announcement";
import {
  capabilitiesAffectedByPolicyModule,
  surfacesAffectedByPolicyModule,
} from "./capability-routing";

export type PropagationClearanceResult = {
  ok: boolean;
  errors: string[];
  checked: string[];
};

/** Full build-clock clearance — run in CI via `pnpm propagation:check`. */
export function runPropagationClearance(): PropagationClearanceResult {
  const errors: string[] = [];
  const checked: string[] = [];

  const manifests = validateAllVerticalManifests();
  checked.push("vertical.manifests");
  if (!manifests.ok) errors.push(...manifests.errors);

  const routing = validateCapabilityRouting();
  checked.push("capability.routing");
  if (!routing.ok) errors.push(...routing.errors);

  const surfaces = validateSurfaceConsumers();
  checked.push("surface.consumers");
  if (!surfaces.ok) errors.push(...surfaces.errors);

  const copyPrograms = validateAllVerticalCopyPrograms();
  checked.push("vertical.copy");
  for (const c of copyPrograms) {
    if (!c.ok) errors.push(...c.errors.map((e) => `[copy] ${e}`));
  }

  for (const vertical of businessVerticalSchema.options) {
    const ann = validateVerticalAnnouncement(vertical);
    if (!ann.ok) {
      errors.push(
        `${vertical}: announcement ${ann.missingDefaults.join(", ")} ${ann.handshakeErrors.join("; ")}`.trim(),
      );
    }
  }
  checked.push("vertical.announcement");

  if (PLATFORM_DEFAULT_VERTICAL_ATTRIBUTES.length < 10) {
    errors.push("PLATFORM_DEFAULT_VERTICAL_ATTRIBUTES unexpectedly short");
  }
  checked.push("platform.defaults");

  return { ok: errors.length === 0, errors, checked };
}

export type PropagationImpactReport = {
  policyModule: string;
  capabilities: string[];
  surfaceIds: string[];
  verticals: string[];
  tests: string[];
};

/** Dev ergonomics: what does editing this policy file affect? */
export function propagationImpactForModule(modulePath: string): PropagationImpactReport {
  const basename = modulePath.replace(/^.*[/\\]/, "");

  const capabilities = capabilitiesAffectedByPolicyModule(basename);
  const surfaceIds = surfacesAffectedByPolicyModule(basename);

  const testMap: Record<string, string[]> = {
    "booking-experience-copy.ts": [
      "booking-experience-copy.test.ts",
      "vertical-pending-copy-coverage.test.ts",
      "vertical-copy-program.test.ts",
    ],
    "vertical-copy-program.ts": ["vertical-copy-program.test.ts"],
    "vertical-announcement.ts": ["vertical-announcement.test.ts"],
    "continuity-templates.ts": ["vertical-copy-program.test.ts"],
    "guest-public-experience.ts": ["vertical-copy-program.test.ts"],
    "vocabulary.ts": ["owner-home-bookings.test.ts", "vertical-copy-program.test.ts"],
  };

  const verticals = [...businessVerticalSchema.options];

  return {
    policyModule: basename,
    capabilities,
    surfaceIds,
    verticals: capabilities.length || surfaceIds.length ? verticals : [],
    tests: testMap[basename] ?? ["propagation-program.test.ts", "vertical:check"],
  };
}
