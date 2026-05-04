export type PublicSlot = {
  startsAt: string;
  endsAt: string;
  staffId: string;
};

/** True if `slots` contains the exact staff + start/end window (from `listPublicSlotsForDay`). */
export function isWindowInPublicSlotList(
  slots: PublicSlot[],
  staffId: string,
  startsAt: Date,
  endsAt: Date,
): boolean {
  const s = startsAt.getTime();
  const e = endsAt.getTime();
  return slots.some(
    (o) =>
      o.staffId === staffId &&
      new Date(o.startsAt).getTime() === s &&
      new Date(o.endsAt).getTime() === e,
  );
}

