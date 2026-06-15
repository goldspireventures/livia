/**
 * Vertical manifest — compile existing policy modules into one registration object.
 * Adding a vertical: extend hub modules, then `compileVerticalManifest` must pass CI.
 */
import type { BusinessVertical, VerticalPack } from "../types";
import { businessVerticalSchema } from "../types";
import type { VerticalCoverageEntry } from "../vertical-coverage";
import { VERTICAL_COVERAGE_REGISTRY } from "../vertical-coverage";
import { VERTICAL_PACKS } from "../verticals";
import {
  getVerticalAnnouncementPackage,
  validateVerticalAnnouncement,
  type VerticalAnnouncementValidation,
} from "../vertical-announcement";
import { validateVerticalCopyProgram, type VerticalCopyValidation } from "../vertical-copy-program";
import { getVerticalPlaybook } from "../vertical-playbooks";
import { guestSurfacesForVertical } from "../guest-surfaces";
import { getContinuityTemplate } from "../continuity-templates";
import { guestPublicExperience } from "../guest-public-experience";
import { bookingExperienceCopy } from "../booking-experience-copy";
import { businessVocabulary } from "../vocabulary";
import { capabilityIdsForVertical } from "./capability-routing";

export type CompiledVerticalManifest = {
  vertical: BusinessVertical;
  pack: VerticalPack;
  registry: VerticalCoverageEntry | null;
  demoSlug: string | null;
  programDoc: string;
  capabilityIds: string[];
  guestSurfaceCount: number;
  clearance: {
    copy: VerticalCopyValidation;
    announcement: VerticalAnnouncementValidation;
  };
  snapshot: {
    vocabularyHint: string;
    ownerTodayTitle: string;
    continuityPanelTitle: string;
    guestHeroTitle: string;
    hasContinuityTemplate: boolean;
  };
};

function registryRowFor(vertical: BusinessVertical): VerticalCoverageEntry | null {
  return (
    VERTICAL_COVERAGE_REGISTRY.find(
      (r) => r.codeVertical === vertical || r.nearestPack === vertical,
    ) ?? null
  );
}

/** Assemble manifest from canonical policy modules (no duplicate data). */
export function compileVerticalManifest(vertical: BusinessVertical): CompiledVerticalManifest {
  const pack = VERTICAL_PACKS[vertical];
  const registry = registryRowFor(vertical);
  const announcement = getVerticalAnnouncementPackage(vertical);
  const vocab = businessVocabulary(vertical, null);
  const booking = bookingExperienceCopy(vertical, null);
  const guest = guestPublicExperience(vertical, null);
  const continuity = getContinuityTemplate(vertical);

  return {
    vertical,
    pack,
    registry,
    demoSlug: registry?.demoSlug ?? null,
    programDoc: announcement.programDoc,
    capabilityIds: capabilityIdsForVertical(vertical),
    guestSurfaceCount: guestSurfacesForVertical(vertical).length,
    clearance: {
      copy: validateVerticalCopyProgram(vertical),
      announcement: validateVerticalAnnouncement(vertical),
    },
    snapshot: {
      vocabularyHint: pack.livVocabularyHint,
      ownerTodayTitle: vocab.ownerTodayScheduleTitle,
      continuityPanelTitle: booking.continuityPanelTitle,
      guestHeroTitle: guest.heroTitle,
      hasContinuityTemplate: Boolean(continuity.smsBody),
    },
  };
}

export function compileAllVerticalManifests(): Record<BusinessVertical, CompiledVerticalManifest> {
  return Object.fromEntries(
    businessVerticalSchema.options.map((v) => [v, compileVerticalManifest(v)]),
  ) as Record<BusinessVertical, CompiledVerticalManifest>;
}

/** Input for a *new* vertical — all required hub slices in one declaration. */
export type VerticalManifestDefinition = {
  vertical: BusinessVertical;
  pack: VerticalPack;
  registry: Pick<VerticalCoverageEntry, "docId" | "label" | "tier" | "demoSlug" | "revenueNote">;
};

/**
 * Register a new vertical manifest at authoring time.
 * Existing verticals use compileVerticalManifest; new verticals pass this in PR + fill hub modules.
 */
export function defineVerticalManifest(def: VerticalManifestDefinition): VerticalManifestDefinition {
  if (!def.pack.vertical || def.pack.vertical !== def.vertical) {
    throw new Error(`defineVerticalManifest: pack.vertical must match ${def.vertical}`);
  }
  if (!def.registry.demoSlug?.trim()) {
    throw new Error(`defineVerticalManifest: demoSlug required for ${def.vertical}`);
  }
  getVerticalPlaybook(def.vertical);
  return def;
}

export function validateAllVerticalManifests(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const vertical of businessVerticalSchema.options) {
    const m = compileVerticalManifest(vertical);
    if (!m.clearance.copy.ok) {
      errors.push(...m.clearance.copy.errors.map((e) => `[copy] ${e}`));
    }
    if (!m.clearance.announcement.ok) {
      errors.push(
        ...m.clearance.announcement.missingDefaults.map(
          (d) => `${vertical}: missing announcement default ${d}`,
        ),
      );
      errors.push(...m.clearance.announcement.handshakeErrors.map((e) => `${vertical}: ${e}`));
    }
    if (!m.registry) {
      errors.push(`${vertical}: missing VERTICAL_COVERAGE_REGISTRY row`);
    }
    if (!m.demoSlug) {
      errors.push(`${vertical}: missing demoSlug in registry`);
    }
    if (m.guestSurfaceCount < 1) {
      errors.push(`${vertical}: guestSurfacesForVertical empty`);
    }
    if (!m.snapshot.hasContinuityTemplate) {
      errors.push(`${vertical}: continuity template missing`);
    }
  }
  return { ok: errors.length === 0, errors };
}
