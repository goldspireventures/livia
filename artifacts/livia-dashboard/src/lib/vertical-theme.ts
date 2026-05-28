import type { BusinessVertical } from "@workspace/policy";
import { resolveVerticalKey } from "@workspace/policy";

export type VerticalShellKind =
  | "warm"
  | "clinical"
  | "soft"
  | "bold"
  | "playful"
  | "industrial";

/** Per-vertical design tokens — applied on `html[data-vertical]`. */
export const VERTICAL_THEMES: Record<
  BusinessVertical,
  {
    primary: string;
    accent: string;
    ring: string;
    heroFrom: string;
    heroTo: string;
    motion: "calm" | "crisp" | "clinical";
    shell: VerticalShellKind;
    /** Public card corner radius feel */
    radius: "xl" | "lg" | "md" | "sm";
    /** Display typography weight on public pages */
    display: "serif" | "sans";
  }
> = {
  hair: {
    primary: "43 74% 52%",
    accent: "43 60% 45%",
    ring: "43 74% 52%",
    heroFrom: "43 30% 12%",
    heroTo: "258 40% 14%",
    motion: "crisp",
    shell: "warm",
    radius: "xl",
    display: "serif",
  },
  beauty: {
    primary: "330 81% 60%",
    accent: "330 70% 50%",
    ring: "330 81% 60%",
    heroFrom: "330 25% 12%",
    heroTo: "280 30% 14%",
    motion: "crisp",
    shell: "soft",
    radius: "xl",
    display: "serif",
  },
  "body-art": {
    primary: "24 95% 53%",
    accent: "24 90% 45%",
    ring: "24 95% 53%",
    heroFrom: "24 30% 10%",
    heroTo: "0 0% 8%",
    motion: "crisp",
    shell: "bold",
    radius: "md",
    display: "sans",
  },
  wellness: {
    primary: "174 72% 40%",
    accent: "174 60% 35%",
    ring: "174 72% 40%",
    heroFrom: "174 25% 10%",
    heroTo: "200 30% 12%",
    motion: "calm",
    shell: "soft",
    radius: "xl",
    display: "serif",
  },
  fitness: {
    primary: "142 71% 45%",
    accent: "142 60% 38%",
    ring: "142 71% 45%",
    heroFrom: "142 25% 10%",
    heroTo: "160 20% 12%",
    motion: "crisp",
    shell: "bold",
    radius: "lg",
    display: "sans",
  },
  medspa: {
    primary: "258 55% 62%",
    accent: "258 45% 52%",
    ring: "258 55% 62%",
    heroFrom: "258 22% 8%",
    heroTo: "220 18% 6%",
    motion: "clinical",
    shell: "clinical",
    radius: "sm",
    display: "sans",
  },
  "allied-health": {
    primary: "199 89% 48%",
    accent: "199 75% 40%",
    ring: "199 89% 48%",
    heroFrom: "199 35% 10%",
    heroTo: "210 25% 12%",
    motion: "clinical",
    shell: "clinical",
    radius: "md",
    display: "sans",
  },
  "pet-grooming": {
    primary: "271 81% 56%",
    accent: "271 70% 48%",
    ring: "271 81% 56%",
    heroFrom: "271 25% 12%",
    heroTo: "43 20% 12%",
    motion: "calm",
    shell: "playful",
    radius: "xl",
    display: "sans",
  },
  "automotive-detailing": {
    primary: "215 25% 55%",
    accent: "215 20% 45%",
    ring: "215 25% 55%",
    heroFrom: "215 15% 10%",
    heroTo: "0 0% 8%",
    motion: "crisp",
    shell: "industrial",
    radius: "md",
    display: "sans",
  },
};

export function applyVerticalTheme(vertical?: string | null, category?: string | null) {
  const key = resolveVerticalKey(vertical, category);
  const t = VERTICAL_THEMES[key];
  const root = document.documentElement;
  root.dataset.vertical = key;
  root.dataset.verticalShell = t.shell;
  root.dataset.verticalDisplay = t.display;
  root.style.setProperty("--primary", t.primary);
  root.style.setProperty("--ring", t.ring);
  root.style.setProperty("--sidebar-primary", t.primary);
  root.style.setProperty("--vertical-accent", t.accent);
  root.style.setProperty("--vertical-hero-from", t.heroFrom);
  root.style.setProperty("--vertical-hero-to", t.heroTo);
  root.style.setProperty("--vertical-radius", t.radius === "xl" ? "1rem" : t.radius === "lg" ? "0.75rem" : t.radius === "md" ? "0.5rem" : "0.25rem");
  root.dataset.motion = t.motion;
}

export function clearVerticalTheme() {
  const root = document.documentElement;
  delete root.dataset.vertical;
  delete root.dataset.verticalShell;
  delete root.dataset.verticalDisplay;
  delete root.dataset.motion;
  root.style.removeProperty("--vertical-accent");
  root.style.removeProperty("--vertical-hero-from");
  root.style.removeProperty("--vertical-hero-to");
  root.style.removeProperty("--vertical-radius");
}
