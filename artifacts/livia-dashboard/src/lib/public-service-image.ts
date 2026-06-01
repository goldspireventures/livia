import type { BusinessVertical } from "@workspace/policy";
import {
  inferPublicServiceImageFromName,
  PUBLIC_SERVICE_IMAGE_KEYWORDS,
  resolvePublicServiceImageUrl as resolveFromPolicy,
} from "@workspace/policy";

const VERTICAL_FALLBACK: Partial<Record<BusinessVertical, string>> = {
  hair: PUBLIC_SERVICE_IMAGE_KEYWORDS.cut,
  beauty: PUBLIC_SERVICE_IMAGE_KEYWORDS.lash,
  "body-art": PUBLIC_SERVICE_IMAGE_KEYWORDS.tattoo,
  wellness: PUBLIC_SERVICE_IMAGE_KEYWORDS.massage,
};

export function resolvePublicServiceImageUrl(
  serviceName: string,
  vertical?: string | null,
  imageUrl?: string | null,
): string | undefined {
  const v = vertical as BusinessVertical | undefined;
  const fallback = v ? VERTICAL_FALLBACK[v] : undefined;
  return resolveFromPolicy(serviceName, fallback, imageUrl);
}

export { inferPublicServiceImageFromName };
