import type { OnboardingActId } from "@/lib/onboarding-acts";
import { portalChapterLabel } from "@/lib/onboarding-portal-chapters";
import type { verticalPackUi } from "@/lib/vertical-pack-ui";

type Vocab = ReturnType<typeof verticalPackUi>;

/** Liv speaks first each chapter — short, host-like, not form instructions. */
export function onboardingLivHostLine(
  act: OnboardingActId,
  vocab: Vocab,
  businessName?: string,
): string {
  const shop = businessName?.trim() || `your ${vocab.locationNoun.toLowerCase()}`;
  const services = vocab.serviceNoun.toLowerCase();
  const team = vocab.teamNoun.toLowerCase();

  const lines: Record<OnboardingActId, string> = {
    a1_create_business: `Welcome in. Tell me about the ${vocab.locationNoun.toLowerCase()} we're opening — I'll seed ${services} and policies from your answers.`,
    a2_shop_profile: `Let's put ${shop} on the map — name, phone, and a line clients will see on your booking page.`,
    a3_service_menu: `Your starter ${services} menu is already here. Skim it — we'll tune prices and durations in a minute.`,
    a4_team: `You're on the ${team} team. Invite others when you're ready, or run solo for now.`,
    a5_hours: `When are you open? I'll only offer slots Liv can actually book.`,
    a6_liv: `This is me. Type how I should greet people — watch the phone on the right reply.`,
    a7_channels: `Connect where clients already message you. One inbox, one colleague.`,
    a8_public_link: `Your booking page is live in the portal wall on the right. This is what customers see.`,
    a9_billing: `Lock in your plan for launch — beta pricing stays honest in Settings later.`,
    a10_invite_team: `Bring your ${team} in when you want — they land in the same cockpit.`,
    a11_migration: `Optional: pull clients across from a sheet or your old system. Skip if you're starting fresh.`,
    a12_go_live: `Last checks, then I hand you the cockpit. Your day is waiting behind the glass.`,
  };
  return lines[act];
}

export function onboardingPortalChapterLabel(act: OnboardingActId): string {
  return portalChapterLabel(act);
}
