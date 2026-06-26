import type { OnboardingActId } from "@/lib/onboarding-acts";
import { portalChapterLabel } from "@/lib/onboarding-portal-chapters";
import type { verticalPackUi } from "@/lib/vertical-pack-ui";

type Vocab = ReturnType<typeof verticalPackUi>;

/** One line per step — what to do, not brand poetry. */
export function onboardingLivHostLine(
  act: OnboardingActId,
  vocab: Vocab,
  _businessName?: string,
): string {
  const loc = vocab.locationNoun.toLowerCase();
  const services = vocab.serviceNoun.toLowerCase();
  const team = vocab.teamNoun.toLowerCase();

  const lines: Partial<Record<OnboardingActId, string>> = {
    a1_create_business: `Name your ${loc} and pick your trade. We handle defaults from here.`,
    a2_shop_profile: "Public name, phone, and a short line for your booking page.",
    a3_service_menu: `Starter ${services} are already in — adjust anytime in Settings.`,
    a4_team: `You are on the ${team} list. Invite others later if you want.`,
    a5_hours: "When you take bookings. Liv only offers slots inside these hours.",
    a6_liv: "Liv has a default voice. Tune her in Settings when you are ready.",
    a7_channels: "SMS and social connect in Settings — skip for now if you like.",
    a8_public_link: "Your booking link is live. Share it when you are ready.",
    a9_billing: "Subscribe or apply a partner code.",
    a10_invite_team: `Invite ${team} from Settings when you need help.`,
    a11_migration: "Pick your old system or upload a file — we map menu and clients for you.",
    a12_go_live: "Open Livia — Liv will nudge you on Today for anything still open.",
  };
  return lines[act] ?? "Continue setup — you can change this later.";
}

export function onboardingPortalChapterLabel(act: OnboardingActId): string {
  return portalChapterLabel(act);
}
