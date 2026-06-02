import {
  applyPresentationTheme,
  clearExperienceTheme,
  clearPresentationTheme,
} from "@/lib/experience-theme";
import { clearBeautyAmbient } from "@/lib/beauty-ambient";
import { clearGatewaySkinHandoff } from "@/lib/gateway-skin-handoff";

/** Undo handoff reveal animation residue on `#root` (blur/opacity can ghost tenant UI). */
export function resetGatewayDomShell(): void {
  const el = document.documentElement;
  el.removeAttribute("data-gateway-handoff-reveal");
  el.classList.remove("app-shell-locked");
  el.classList.remove("appearance-embed-dashboard");

  const root = document.getElementById("root");
  if (root) {
    root.style.removeProperty("filter");
    root.style.removeProperty("opacity");
    root.style.removeProperty("animation");
  }
}

/** W2 gateway / demo — strip tenant W4 chrome from `documentElement`. */
export function applyGatewaySurfaceTheme(): void {
  clearGatewaySkinHandoff();

  const el = document.documentElement;
  clearExperienceTheme();
  clearPresentationTheme();
  clearBeautyAmbient(el);

  delete el.dataset.guestSurface;
  delete el.dataset.beautyNativeSkin;
  delete el.dataset.persona;
  delete el.dataset.presentation;
  delete el.dataset.vertical;
  delete el.dataset.verticalShell;
  delete el.dataset.verticalDisplay;
  delete el.dataset.motion;

  el.style.removeProperty("--brand-accent");
  el.style.removeProperty("--persona-accent");
  el.style.removeProperty("--persona-accent-soft");

  resetGatewayDomShell();
  el.classList.add("dark");
  applyPresentationTheme({ cssPreset: "platform-default", colorMode: "dark" });
}
