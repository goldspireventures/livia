import { describe, expect, it } from "vitest";

import {
  MAX_BEAUTY_FEATURED_GRID,
  pickFeaturedPublicServices,
  SHOW_ALL_SERVICES_IN_GRID_MAX,
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
  it("puts every treatment in the grid when count is within SHOW_ALL_SERVICES_IN_GRID_MAX", () => {
    const services = [
      svc("1", "Lash fill", 1),
      svc("2", "Classic manicure", 2),
      svc("3", "Brow shape", 3),
      svc("4", "Gel nails", 4),
      svc("5", "Lash lift", 5),
    ];
    const { featured, rest } = pickFeaturedPublicServices(services, []);
    expect(featured).toHaveLength(5);
    expect(rest).toHaveLength(0);
    expect(featured.map((s) => s.name)).toContain("Brow shape");
  });

  it("splits featured grid and overflow when catalog is large", () => {
    const services = Array.from({ length: SHOW_ALL_SERVICES_IN_GRID_MAX + 2 }, (_, i) =>
      svc(String(i), `Service ${i}`, i),
    );
    const { featured, rest } = pickFeaturedPublicServices(services, []);
    expect(featured).toHaveLength(MAX_BEAUTY_FEATURED_GRID);
    expect(rest.length).toBe(services.length - MAX_BEAUTY_FEATURED_GRID);
  });
});
