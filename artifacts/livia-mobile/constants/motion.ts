/**
 * Motion vocabulary for Livia mobile (ADR 0008).
 *
 * Three spring presets cover ~95% of UI motion. If a screen needs something
 * else, add it here with a one-line note about *why* — never inline magic
 * numbers in a screen file.
 */
import type { WithSpringConfig, WithTimingConfig } from "react-native-reanimated";
import { Easing } from "react-native-reanimated";

/** Calm, default. For most surface entries, card lifts, opacity reveals. */
export const SPRING_GENTLE: WithSpringConfig = {
  damping: 18,
  stiffness: 140,
  mass: 0.9,
};

/** Crisp + fast. For chip / segmented-control indicators, tab indicators. */
export const SPRING_QUICK: WithSpringConfig = {
  damping: 22,
  stiffness: 280,
  mass: 0.7,
};

/** A little overshoot. Reserved for delight moments — success ticks, confirmations. */
export const SPRING_BOUNCY: WithSpringConfig = {
  damping: 11,
  stiffness: 220,
  mass: 0.9,
};

/** Standard fade-through duration for route transitions (ms). */
export const FADE_THROUGH_MS = 180;

/** Standard breathing-loop period for ambient halos (ms, full in-out cycle). */
export const BREATH_PERIOD_MS = 4200;

/** Smooth, opinionated easing for ambient breathing effects. */
export const BREATH_TIMING: WithTimingConfig = {
  duration: BREATH_PERIOD_MS / 2,
  easing: Easing.inOut(Easing.sin),
};

/** Stagger interval (ms) for sequenced reveals (e.g. stat cards). */
export const STAGGER_MS = 70;
