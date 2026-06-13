/**
 * W6 guest hub (`/my`) — cross-business client portal copy.
 * Plain language for people who book — not staff or owner terminology.
 */

export const GUEST_HUB_COPY = {
  productName: "My Livia",
  tagline: "Your bookings and visits, all in one place",
  signInTitle: "Sign in with your phone",
  signInBody:
    "Use the same mobile number you book with — we'll show upcoming visits and every studio you've used.",
  signInBulletSingleSignIn: "One sign-in for every Livia studio you book with — no passwords.",
  signInBulletHistory:
    "Upcoming visits, session packs, design proofs, and messages — together in My Livia.",
  signInVerifyCta: "Continue",
  vaultTitle: "Manage your bookings",
  vaultSubtitle: "Upcoming visits, favourites, and how studios reach you — in one place",
  bookingsNav: "Your favourites",
  upcomingSection: "Coming up",
  favoritesSection: "Favourites",
  allShopsSection: "All studios",
  moreShopsSection: "More studios",
  accountSection: "Account & preferences",
  accountSectionBody: "Your number, how Liv and studios contact you, and session packs.",
  accountSettingsLink: "Account & preferences",
  commsChannelLabel: "How Liv reaches you",
  manageVisitCta: "Manage visit →",
  emptyShops:
    "Book at any Livia studio — when you're signed in here, your history with them shows up automatically.",
  bookAgainCta: "Book again",
  manageStudioCta: "View studio",
  bookStudioCta: "Book again",
  signOutCta: "Sign out",
  livStripTitle: "Liv",
  livStripBody:
    "Ask about your next visit, book again at a favourite studio, or open a studio you've used before.",
  livChatWelcome:
    "Ask me to book again, check your next visit, or open a studio you've used before.",
  livChatPlaceholder: "Book my usual at Bloom…",
  packageCreditsSection: "Session packs",
  packageCreditsEmpty: "No active session credits — book a pack at your studio or redeem a gift code.",
  redeemCodeLabel: "Gift or pack code",
  redeemCodeCta: "Redeem",
  manageVisitTitle: "Your visit",
  prepSection: "For your visit",
  quickActionsTitle: "Quick actions",
  messageStudioTitle: "Message the studio",
  messageStudioBody: "Goes to their inbox — the team will reply on your thread.",
  messagePlaceholder: "Running late, change request, or a question…",
  messageSent: "Message sent — the studio will reply on your thread.",
  runningLateConfirmed: "We've let the team know you're on your way.",
  actionFailed: "Something went wrong — try again.",
  signInRequired: "Sign in to manage this visit.",
  visitNotFound:
    "We couldn't find this visit — check you're signed in with the same number you book with.",
  memoryTitle: "They remember",
  petSectionTitle: "Your pets",
  backToVault: "Back to My Livia",
  shopNotFound: "This studio isn't on your account yet.",
  relationshipVisits: "visits together",
  relationshipSectionTitle: "Your relationship",
  artifactFooter: "My Livia keeps your history with each studio in one place.",
  stagingBannerTitle: "Demo mode",
  stagingBannerBody: "Use any test phone number and the fixed code shown below.",
  demoGuestPhone: "+353 87 100 0001",
  demoGuestHint:
    "Demo guest Mary — sign in with +353 87 100 0001. She's linked to hair, beauty, wellness, tattoo, fitness, pet, and auto demo studios.",
} as const;

/** Demo launcher — fresh founder self-serve (not demo roster). */
export const DEMO_FRESH_FOUNDER_COPY = {
  kicker: "Testing fresh flows",
  title: "Create a new account & shop",
  body: "Use a personal email (not @livia.io) — sign up, accept terms, then walk through real onboarding. Separate from demo roster logins below.",
  ctaSignUp: "Sign up",
  ctaOnboarding: "Onboarding",
  endClientHint: "End clients: use the My Livia card below.",
} as const;

/** Demo launcher — end-client entry (no Clerk). */
export const DEMO_GUEST_CLIENT_COPY = {
  title: "Try it as a client",
  body: "My Livia is where guests manage visits, rebook, and message studios — no business login needed.",
  cta: "Open My Livia",
  phoneHint: "Demo number +353 87 100 0001 — use the code on the sign-in screen.",
  nameHint: "Demo guest Mary · linked across all showcase studios",
} as const;

/** Native app cold open — operator vs guest split (W4 + W6). */
export const LIVIA_MOBILE_ENTRY_COPY = {
  kicker: "One app · two doors",
  title: "Who is Livia for you today?",
  operatorTitle: "I work at a studio",
  operatorBody: "Owners, managers, staff — run bookings, inbox, and the floor with Liv.",
  operatorCta: "Sign in to your studio",
  guestTitle: "My bookings & visits",
  guestBody:
    "Rebook, manage appointments, design proofs, aftercare, and session packs — on the go, no password.",
  guestCta: "Open My Livia",
  guestPhoneHint: "Verify once with the mobile number you book with.",
  staffBackLink: "Not staff? Back to home",
  guestStaffLink: "Work at a studio? Sign in",
  demoTitle: "Walk the demo",
  demoBody: "Pick a trade world, set up once, then sign in as owner or staff — same G1 flow as web /demo.",
  demoCta: "Open demo gateway",
} as const;
