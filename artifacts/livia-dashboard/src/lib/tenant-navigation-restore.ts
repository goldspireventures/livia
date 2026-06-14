import { isPublicGuestPath } from "@/lib/public-guest-paths";

/** Strip guest-route DOM state so authenticated shell re-renders after browser back. */
export function clearGuestRouteDomState() {
  const el = document.documentElement;
  el.classList.remove("presentation-swap-lock");
  delete el.dataset.guestSurface;
  delete el.dataset.beautyAmbient;
  delete el.dataset.beautyNativeSkin;
  delete el.dataset.wellnessNativeSkin;
  delete el.dataset.bodyArtNativeSkin;
  el.style.removeProperty("color-scheme");
}

export function isLeavingGuestRoute(prevPath: string, nextPath: string): boolean {
  return isPublicGuestPath(prevPath) && !isPublicGuestPath(nextPath);
}
