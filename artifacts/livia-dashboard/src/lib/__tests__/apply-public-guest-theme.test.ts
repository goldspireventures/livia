import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  warmPublicGuestSurfaceTheme,
  clearPublicGuestSurfaceTheme,
} from "@/lib/apply-public-guest-theme";

describe("apply-public-guest-theme", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/api/public/b/bloom-beauty-dublin")) {
          return {
            ok: true,
            json: async () => ({
              vertical: "beauty",
              experienceSkin: {
                presentation: "platform-default",
                presentationColorMode: "dark",
                brandAccentHex: null,
              },
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      }),
    );
  });

  afterEach(() => {
    clearPublicGuestSurfaceTheme();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("falls back to book storefront skin when token payload has no experienceSkin", async () => {
    await warmPublicGuestSurfaceTheme({
      slug: "bloom-beauty-dublin",
      vertical: "beauty",
    });

    expect(document.documentElement.dataset.presentation).toBe("platform-default");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("43 38% 66%");
  });
});
