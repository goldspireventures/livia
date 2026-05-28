import type { Href } from "expo-router";

/** Cast paths that exist in the file tree but are not yet in generated Expo Router types. */
export function asHref(path: string): Href {
  return path as Href;
}

export function routeRoot(segments: readonly string[]): string | undefined {
  return segments[0] as string | undefined;
}

export function isDemoRoute(segments: readonly string[]): boolean {
  return routeRoot(segments) === "demo";
}
