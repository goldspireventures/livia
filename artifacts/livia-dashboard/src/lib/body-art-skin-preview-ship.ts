import {
  isBodyArtSkinPreviewAiConfigured,
  isBodyArtSkinPreviewEnabled,
  resolveBodyArtSkinPreviewPhase,
  type SkinPreviewDeploySurface,
  type SkinPreviewShipPhase,
} from "@workspace/policy";
import { getDeployEnvironment } from "@/lib/deploy-environment";

function dashboardEnv(): Record<string, string | undefined> {
  return import.meta.env as Record<string, string | undefined>;
}

function dashboardDeploySurface(): SkinPreviewDeploySurface {
  return getDeployEnvironment();
}

export function bodyArtSkinPreviewPhase(): SkinPreviewShipPhase {
  return resolveBodyArtSkinPreviewPhase(dashboardDeploySurface(), dashboardEnv());
}

/** Phase 2/3 photo preview — only when env override is set locally. */
export function bodyArtSkinPreviewEnabled(): boolean {
  return isBodyArtSkinPreviewEnabled(dashboardDeploySurface(), dashboardEnv());
}

export function bodyArtSkinPreviewAiConfigured(): boolean {
  return isBodyArtSkinPreviewAiConfigured(dashboardEnv());
}
