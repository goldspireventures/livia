/** UI copy from `@workspace/policy` — one vocabulary for all verticals. */
import { businessVocabulary } from "@workspace/policy";

export function verticalPackUi(vertical: string | undefined | null, category?: string | null) {
  const v = businessVocabulary(vertical, category);
  return {
    label: v.label,
    clientNoun: v.clientNoun,
    serviceNoun: v.serviceNoun,
    locationNoun: v.locationNoun,
    teamNoun: v.teamNoun,
    hint: v.hint,
    ownerTodayLine: v.ownerTodayLine,
    ownerTodayScheduleTitle: v.ownerTodayScheduleTitle,
    ownerTodayScheduleCalendarCta: v.ownerTodayScheduleCalendarCta,
    runningLateLabel: v.runningLateLabel,
  };
}
