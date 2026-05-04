import { describe, expect, it } from "vitest";

import type { PublicSlot } from "./slotUtils";
import { isWindowInPublicSlotList } from "./slotUtils";

function slot(staffId: string, startsAtIso: string, endsAtIso: string): PublicSlot {
  return { staffId, startsAt: startsAtIso, endsAt: endsAtIso };
}

describe("isWindowInPublicSlotList", () => {
  it("returns true when exact staff+start+end exists", () => {
    const slots: PublicSlot[] = [
      slot("s1", "2026-05-04T10:00:00.000Z", "2026-05-04T10:30:00.000Z"),
      slot("s2", "2026-05-04T10:00:00.000Z", "2026-05-04T10:30:00.000Z"),
    ];
    expect(
      isWindowInPublicSlotList(
        slots,
        "s1",
        new Date("2026-05-04T10:00:00.000Z"),
        new Date("2026-05-04T10:30:00.000Z"),
      ),
    ).toBe(true);
  });

  it("returns false when staff differs", () => {
    const slots: PublicSlot[] = [
      slot("s1", "2026-05-04T10:00:00.000Z", "2026-05-04T10:30:00.000Z"),
    ];
    expect(
      isWindowInPublicSlotList(
        slots,
        "s2",
        new Date("2026-05-04T10:00:00.000Z"),
        new Date("2026-05-04T10:30:00.000Z"),
      ),
    ).toBe(false);
  });

  it("returns false when start differs by 1ms", () => {
    const slots: PublicSlot[] = [
      slot("s1", "2026-05-04T10:00:00.000Z", "2026-05-04T10:30:00.000Z"),
    ];
    expect(
      isWindowInPublicSlotList(
        slots,
        "s1",
        new Date("2026-05-04T10:00:00.001Z"),
        new Date("2026-05-04T10:30:00.000Z"),
      ),
    ).toBe(false);
  });

  it("returns false when end differs by 1ms", () => {
    const slots: PublicSlot[] = [
      slot("s1", "2026-05-04T10:00:00.000Z", "2026-05-04T10:30:00.000Z"),
    ];
    expect(
      isWindowInPublicSlotList(
        slots,
        "s1",
        new Date("2026-05-04T10:00:00.000Z"),
        new Date("2026-05-04T10:30:00.001Z"),
      ),
    ).toBe(false);
  });
});

