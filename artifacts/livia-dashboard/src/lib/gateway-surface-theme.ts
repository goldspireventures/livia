import {
  applyPresentationTheme,
  clearExperienceTheme,
  clearPresentationTheme,
} from "@/lib/experience-theme";
import { applyBeautyAmbient } from "@/lib/beauty-ambient";

/** W2 gateway / demo — strip tenant W4 chrome from `documentElement`. */
export function applyGatewaySurfaceTheme(): void {
  const el = document.documentElement;
  clearExperienceTheme();
  clearPresentationTheme();
  delete el.dataset.guestSurface;
  delete el.dataset.beautyNativeSkin;
  delete el.dataset.beautyAmbient;
  delete el.dataset.beautyAmbientSnapshot;
  delete el.dataset.timeOfDay;
  delete el.dataset.persona;
  delete el.dataset.presentation;
  delete el.dataset.vertical;
  delete el.dataset.verticalShell;
  delete el.dataset.verticalDisplay;
  delete el.dataset.motion;
  el.classList.remove("app-shell-locked");
  el.classList.remove("appearance-embed-dashboard");
  el.removeAttribute("data-gateway-handoff-reveal");
  el.style.removeProperty("--brand-accent");
  el.classList.add("dark");
  applyPresentationTheme({ cssPreset: "platform-default", colorMode: "dark" });
  applyBeautyAmbient();
}
