import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  persistTenantPresentationSkin,
  resolveTenantPresentationSkin,
  warmTenantPresentationSkin,
} from "@/lib/tenant-presentation-sync";
import { tenantExperienceQueryKey } from "@/lib/prefetch-tenant-dashboard";

describe("tenant-presentation-sync", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--primary");
    sessionStorage.clear();
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-vertical");
    document.documentElement.removeAttribute("data-presentation");
    document.documentElement.style.removeProperty("--primary");
    sessionStorage.clear();
  });

  it("persists and resolves skin from session for any tenant", () => {
    persistTenantPresentationSkin({
      businessId: "biz-harbour",
      vertical: "wellness",
      cssPreset: "harbour-light",
      colorMode: "light",
    });

    const qc = new QueryClient();
    const skin = resolveTenantPresentationSkin(qc, "biz-harbour", {
      vertical: "wellness",
    });
    expect(skin?.cssPreset).toBe("harbour-light");
  });

  it("does not apply vertical fallback pink when preset is active", () => {
    const qc = new QueryClient();
    warmTenantPresentationSkin(
      qc,
      "biz-bloom",
      { vertical: "beauty", category: "beauty" },
      "owner",
    );

    expect(document.documentElement.dataset.presentation).toBe("platform-default");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("43 38% 66%");
  });

  it("prefers react-query tenant-experience over vertical fallback", () => {
    const qc = new QueryClient();
    qc.setQueryData(tenantExperienceQueryKey("biz-bloom"), {
      vertical: "beauty",
      presentation: {
        cssPreset: "noir-dusk",
        brandAccentHex: null,
        tokens: { colorMode: "dark" },
      },
    });

    const skin = resolveTenantPresentationSkin(qc, "biz-bloom", { vertical: "beauty" });
    expect(skin?.cssPreset).toBe("noir-dusk");

    warmTenantPresentationSkin(qc, "biz-bloom", { vertical: "beauty" });
    expect(document.documentElement.dataset.presentation).toBe("noir-dusk");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("330 45% 72%");
  });
});
