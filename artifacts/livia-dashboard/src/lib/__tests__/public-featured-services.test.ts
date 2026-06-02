import { describe, expect, it } from "vitest";

import {
  featuredServicesHint,
  MAX_BEAUTY_FEATURED_GRID,
  pickFeaturedPublicServices,
  publicBookCatalogCountLabel,
} from "@/lib/public-featured-services";

const svc = (id: string, name: string, sortOrder: number) => ({
  id,
  name,
  sortOrder,
  durationMinutes: 30,
  priceMinor: 1000,
  currency: "EUR",
});

describe("pickFeaturedPublicServices", () => {
  it("keeps a 2×2 hero grid and overflows extra treatments", () => {
    const services = [
      svc("1", "Lash fill", 1),
      svc("2", "Classic manicure", 2),
      svc("3", "Brow shape", 3),
      svc("4", "Gel nails", 4),
      svc("5", "Lash lift", 5),
    ];
    const { featured, rest } = pickFeaturedPublicServices(services, []);
    expect(featured).toHaveLength(MAX_BEAUTY_FEATURED_GRID);
    expect(rest).toHaveLength(1);
    expect(rest[0]?.name).toBe("Lash lift");
    expect(featured.map((s) => s.name)).toContain("Brow shape");
    expect(featuredServicesHint(4, 1, 5, "Services")).toMatch(/more in the list/i);
    expect(publicBookCatalogCountLabel(5, "Services")).toBe("5 services");
  });

  it("splits featured grid and overflow when catalog is large", () => {
    const services = Array.from({ length: 10 }, (_, i) => svc(String(i), `Service ${i}`, i));
    const { featured, rest } = pickFeaturedPublicServices(services, []);
    expect(featured).toHaveLength(MAX_BEAUTY_FEATURED_GRID);
    expect(rest.length).toBe(services.length - MAX_BEAUTY_FEATURED_GRID);
  });
});
