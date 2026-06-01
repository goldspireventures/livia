/**
 * W4 rota — plain-language copy (no internal verbs like "materialize").
 * API routes may keep legacy names; UI uses these strings only.
 */

export const ROTA_OPERATOR_COPY = {
  pageSubtitle:
    "Save weekly hour patterns, then publish them to the team calendar. Bookable slots follow published shifts.",
  templatesSectionDescription:
    "Reusable weekly hours for your usual week. Publish to create shifts for everyone on the active roster.",
  publishWeekCta: "Publish to this week",
  publishingWeekCta: "Publishing…",
  publishWeekToast: (created: number) =>
    created === 1
      ? "1 shift added from your templates"
      : `${created} shifts added from your templates`,
  publishWeekError: "Could not publish shifts from templates",
  noShiftsEmpty:
    "No shifts on the calendar yet — publish from templates above or add a shift manually.",
} as const;
