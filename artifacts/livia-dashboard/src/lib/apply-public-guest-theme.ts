import {
  applyExperienceTheme,
  applyTenantPresentationSurface,
  clearExperienceTheme,
  clearPresentationTheme,
  resolvePresentationColorMode,
} from "@/lib/experience-theme";

export type PublicGuestExperienceSkin = {
  presentation?: string;
  presentationColorMode?: string;
  brandAccentHex?: string | null;
};

const skinCacheKey = (slug: string) => `livia:public-guest-skin:${slug}`;

function readCachedPublicGuestSkin(slug: string): PublicGuestExperienceSkin | null {
  try {
    const raw = sessionStorage.getItem(skinCacheKey(slug));
    return raw ? (JSON.parse(raw) as PublicGuestExperienceSkin) : null;
  } catch {
    return null;
  }
}

function writeCachedPublicGuestSkin(slug: string, skin: PublicGuestExperienceSkin) {
  try {
    sessionStorage.setItem(skinCacheKey(slug), JSON.stringify(skin));
  } catch {
    /* quota / private mode */
  }
}

/** Book storefront payload always carries tenant presentation — token routes may lag deploy. */
export async function fetchPublicGuestExperienceSkin(
  slug: string,
): Promise<PublicGuestExperienceSkin | null> {
  const cached = readCachedPublicGuestSkin(slug);
  if (cached?.presentation) return cached;

  try {
    const r = await fetch(`/api/public/b/${encodeURIComponent(slug)}`);
    if (!r.ok) return cached;
    const book = (await r.json()) as { experienceSkin?: PublicGuestExperienceSkin };
    if (book.experienceSkin?.presentation) {
      writeCachedPublicGuestSkin(slug, book.experienceSkin);
      return book.experienceSkin;
    }
  } catch {
    /* offline / proxy */
  }
  return cached;
}

/** Apply tenant presentation on public /b guest surfaces (book, pay, visit, shop). */
export function applyPublicGuestSurfaceTheme(args: {
  vertical?: string | null;
  category?: string | null;
  country?: string | null;
  experienceSkin?: PublicGuestExperienceSkin | null;
}) {
  const preset = args.experienceSkin?.presentation ?? null;
  applyExperienceTheme({
    vertical: args.vertical,
    category: args.category,
    country: args.country,
    includeVerticalColorTokens: !preset,
  });

  if (!preset && !args.experienceSkin?.brandAccentHex) return;

  const savedMode =
    args.experienceSkin?.presentationColorMode === "light" ||
    args.experienceSkin?.presentationColorMode === "dark"
      ? args.experienceSkin.presentationColorMode
      : null;

  applyTenantPresentationSurface({
    vertical: args.vertical,
    category: args.category,
    country: args.country,
    cssPreset: preset ?? "platform-default",
    brandAccentHex: args.experienceSkin?.brandAccentHex,
    colorMode: savedMode ?? resolvePresentationColorMode(preset),
  });
}

/**
 * Resolve presentation from token payload or book storefront fallback, then apply.
 * Call as soon as slug is known (useLayoutEffect) so pay/visit never flash beauty pink.
 */
export async function warmPublicGuestSurfaceTheme(args: {
  slug: string;
  vertical?: string | null;
  category?: string | null;
  country?: string | null;
  experienceSkin?: PublicGuestExperienceSkin | null;
}) {
  let skin = args.experienceSkin ?? readCachedPublicGuestSkin(args.slug);
  if (!skin?.presentation) {
    skin = (await fetchPublicGuestExperienceSkin(args.slug)) ?? skin;
  } else {
    writeCachedPublicGuestSkin(args.slug, skin);
  }

  applyPublicGuestSurfaceTheme({
    vertical: args.vertical,
    category: args.category,
    country: args.country,
    experienceSkin: skin,
  });
}

export function clearPublicGuestSurfaceTheme() {
  document.documentElement.removeAttribute("data-vertical");
  clearExperienceTheme();
  clearPresentationTheme();
}
