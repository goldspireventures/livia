/**
 * W6 guest hub (`/my`) — cross-business client portal copy.
 * Plain language for people who book — not staff or owner terminology.
 */

export const GUEST_HUB_COPY = {
  productName: "My Livia",
  tagline: "Your bookings and visits, all in one place",
  signInTitle: "Sign in with your phone",
  signInTitleEmail: "Sign in with your email",
  signInMethodPhone: "Mobile",
  signInMethodEmail: "Email",
  signInBody:
    "Use the same mobile number you book with — we'll show upcoming visits and every business you've used.",
  signInBodyEmail:
    "Use the email you book with — we'll text or email a one-time code. Your profile works even before your first visit.",
  signInBodyColdStart:
    "Downloaded the app? Verify once and your My Livia profile is ready — book later and everything links automatically.",
  signInBulletSingleSignIn: "One sign-in for every Livia business you book with — no passwords.",
  signInBulletHistory:
    "Upcoming visits, session packs, design proofs, and messages — together in My Livia.",
  signInVerifyCta: "Continue",
  vaultTitle: "Manage your bookings",
  vaultSubtitle: "Upcoming visits, favourites, and how businesses reach you — in one place",
  bookingsNav: "Your favourites",
  upcomingSection: "Coming up",
  favoritesSection: "Favourites",
  allShopsSection: "All businesses",
  moreShopsSection: "More businesses",
  accountSection: "Account & preferences",
  accountSectionBody: "Your number, how Liv and businesses contact you, and session packs.",
  accountSettingsLink: "Account & preferences",
  commsChannelLabel: "How Liv reaches you",
  manageVisitCta: "Manage visit →",
  emptyUpcomingTitle: "Nothing on the calendar yet",
  emptyUpcomingBody:
    "When you book with Livia, your next visit shows up here — manage, message, or reschedule in one tap.",
  coldStartHint:
    "New here? Verify below — your profile is ready now. Book with any Livia business later and it all links up.",
  profileSection: "Your profile",
  profileDisplayNameLabel: "Name (optional)",
  profileDisplayNamePlaceholder: "How businesses should greet you",
  profileMemberSince: "Member since",
  profileSaveCta: "Save profile",
  profileSaved: "Profile saved",
  welcomeTitle: "Welcome to My Livia",
  welcomeSkip: "Skip",
  welcomeNext: "Next",
  welcomeDone: "Go to my vault",
  redeemSuccess: "Code applied — your session pack is in your vault.",
  redeemNotFound: "We couldn't find that code — check spelling or ask the business.",
  redeemAlreadyUsed: "This code has no sessions left.",
  redeemNotForAccount:
    "This code is linked to another account — sign in with the email or number it was sent to.",
  otpSmsBody: (code: string) => `Your My Livia code is ${code}. It expires in 10 minutes.`,
  otpEmailSubject: "Your My Livia sign-in code",
  otpEmailBody: (code: string) =>
    `Your My Livia sign-in code is ${code}.\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  otpDeliveryFailed: "We couldn't send your code — try again in a moment.",
  otpDeliveryNotConfigured:
    "Sign-in codes aren't available right now — try again later or contact support.",
  postBookVerifyTitle: "Saved to My Livia",
  postBookVerifyBody:
    "Sign in with your booking number to see this visit, message the team, and rebook faster next time.",
  postBookVerifyCta: "Open My Livia",
  favoritesEmpty: "Heart a favourite after a visit — it pins here for quick rebooking.",
  emptyShops:
    "Book with any Livia business — when you're signed in here, your history with them shows up automatically.",
  bookAgainCta: "Book again",
  manageStudioCta: "View business",
  bookStudioCta: "Book again",
  signOutCta: "Sign out",
  livStripTitle: "Liv",
  livStripBody:
    "Ask about your next visit, book again at a favourite, or open a business you've used before.",
  livChatWelcome:
    "Ask me to book again, check your next visit, or open a business you've used before.",
  livChatPlaceholder: "Book my usual at Bloom…",
  packageCreditsSection: "Session packs",
  packageCreditsEmpty: "No active session credits — book a pack at your business or redeem a gift code.",
  redeemCodeLabel: "Gift or pack code",
  redeemCodeCta: "Redeem",
  manageVisitTitle: "Your visit",
  prepSection: "For your visit",
  quickActionsTitle: "Quick actions",
  messageStudioTitle: "Message the team",
  messageStudioBody: "Goes to their inbox — the team will reply on your thread.",
  messagePlaceholder: "Running late, change request, or a question…",
  messageSent: "Message sent — the team will reply on your thread.",
  threadHistoryTitle: "Your thread",
  threadHistoryEmpty: "No messages yet — say hello if you need anything before your visit.",
  runningLateConfirmed: "We've let the team know you're on your way.",
  actionFailed: "Something went wrong — try again.",
  signInRequired: "Sign in to manage this visit.",
  visitNotFound:
    "We couldn't find this visit — check you're signed in with the same number you book with.",
  memoryTitle: "They remember",
  petSectionTitle: "Your pets",
  backToVault: "Back to My Livia",
  shopNotFound: "This business isn't on your account yet.",
  relationshipVisits: "visits together",
  relationshipSectionTitle: "Your relationship",
  artifactFooter: "My Livia keeps your history with each business in one place.",
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

/** Demo launcher — consult-first verticals (event website, not My Livia). */
export const DEMO_CONSULT_FIRST_GUEST_COPY = {
  title: "Try it as a client",
  body: "Your public event website — structured enquire, quote review, and deposit pay. No guest app login.",
  cta: "Open enquire form",
  hint: "Same path couples take from Instagram or your website link.",
} as const;

/** Native app cold open — guest vs business registration (W4 + W6). */
export const LIVIA_MOBILE_ENTRY_COPY = {
  subtitle: "Tell us why you're here.",
  guestTitle: "Set up My Livia",
  guestBody: "Book appointments and visits — verify with phone or email.",
  operatorTitle: "Business registration",
  operatorBody: "For owners starting on Livia — create your business, then invite your team.",
  operatorRegisterCta: "Register my business",
  staffBackLink: "Back to home",
  guestStaffLink: "Work at a business? Sign in",
  /** Demo-only — routes gated by `EXPO_PUBLIC_DEMO_LOGIN=true`. */
  demoTitle: "Walk the demo",
  demoBody: "Pick a trade world, set up once, then sign in as owner or staff — same G1 flow as web /demo.",
  demoCta: "Open demo gateway",
} as const;
