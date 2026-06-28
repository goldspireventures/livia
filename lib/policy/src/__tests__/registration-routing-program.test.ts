import assert from "node:assert/strict";
import {
  filterSessionBusinesses,
  isDemoWorldSlug,
  ownedSessionBusinesses,
  pickOnboardingResumeBusiness,
  pickPrimarySessionBusiness,
  resolvePostLegalDestination,
  resolvePostSignInLandingPath,
  staffInviteClerkRedirectUrl,
  staffInviteMobileRedirectUrl,
} from "../registration-routing-program";

assert.equal(isDemoWorldSlug("dublin-barber-collective"), true);
assert.equal(isDemoWorldSlug("my-real-shop"), false);

const demoRows = [
  { id: "1", slug: "dublin-barber-collective", ownerId: "owner-demo" },
  {
    id: "2",
    slug: "my-salon",
    ownerId: "user-real",
    onboardingState: {
      currentAct: "a2_shop_profile",
      completedActs: ["a1_create_business"],
      percentComplete: 8,
    },
  },
];

const filtered = filterSessionBusinesses(demoRows, "founder@gmail.com");
assert.equal(filtered.length, 1);
assert.equal(filtered[0]!.slug, "my-salon");

assert.equal(
  resolvePostLegalDestination({
    businesses: demoRows,
    clerkUserId: "user-real",
    email: "founder@gmail.com",
  }),
  "/onboarding",
);

assert.equal(
  resolvePostLegalDestination({
    businesses: [],
    clerkUserId: "user-new",
    email: "founder@gmail.com",
  }),
  "/onboarding",
);

assert.equal(
  resolvePostLegalDestination({
    businesses: [{ id: "shop-1", slug: "some-salon", ownerId: "other-user" }],
    clerkUserId: "staff-user",
    email: "stylist@gmail.com",
  }),
  "/dashboard",
);

assert.equal(
  staffInviteClerkRedirectUrl("https://app.livia-hq.com"),
  "https://app.livia-hq.com/staff-invite",
);

const picked = pickPrimarySessionBusiness(
  [
    { id: "a", slug: "dublin-barber-collective", ownerId: "x" },
    { id: "b", slug: "my-shop", ownerId: "user-1" },
  ],
  "user-1",
  "founder@gmail.com",
);
assert.equal(picked?.id, "b");

const staffOnly = pickPrimarySessionBusiness(
  [{ id: "staff-shop", slug: "some-salon", ownerId: "other-user" }],
  "user-new",
  "founder@gmail.com",
);
assert.equal(staffOnly, null);

const demoStaff = pickPrimarySessionBusiness(
  [{ id: "demo-shop", slug: "luxe-salon-spa", ownerId: "demo-owner" }],
  "demo-user",
  "owner@demo.livia-hq.com",
);
assert.equal(demoStaff?.id, "demo-shop");

const resumeNone = pickOnboardingResumeBusiness(
  [{ id: "1", slug: "dublin-barber-collective", ownerId: "user-1" }],
  "user-1",
  "founder@gmail.com",
);
assert.equal(resumeNone, null);

const resumeOwned = pickOnboardingResumeBusiness(
  [
    {
      id: "shop-1",
      slug: "my-shop",
      ownerId: "user-1",
      onboardingState: { currentAct: "a2_shop_profile", completedActs: ["a1_create_business"], percentComplete: 8 },
    },
  ],
  "user-1",
  "founder@gmail.com",
);
assert.equal(resumeOwned?.id, "shop-1");

const multiOwned = pickOnboardingResumeBusiness(
  [
    {
      id: "shop-stale",
      slug: "stale-shop",
      ownerId: "user-1",
      onboardingState: { currentAct: "a2_shop_profile", completedActs: ["a1_create_business"], percentComplete: 8 },
    },
    {
      id: "shop-progress",
      slug: "main-shop",
      ownerId: "user-1",
      onboardingState: {
        currentAct: "a5_hours",
        completedActs: ["a1_create_business", "a2_shop_profile"],
        percentComplete: 40,
      },
      vertical: "allied-health",
    },
  ],
  "user-1",
  "founder@gmail.com",
);
assert.equal(multiOwned?.id, "shop-progress");

assert.equal(
  resolvePostLegalDestination({
    businesses: [
      {
        id: "shop-done",
        slug: "live-shop",
        ownerId: "user-1",
        onboardingState: { currentAct: "a12_go_live", completedActs: ["a1_create_business", "a2_shop_profile", "a5_hours"], percentComplete: 100 },
        vertical: "allied-health",
      },
      {
        id: "shop-draft",
        slug: "draft-shop",
        ownerId: "user-1",
        onboardingState: { currentAct: "a2_shop_profile", completedActs: ["a1_create_business"], percentComplete: 8 },
      },
    ],
    clerkUserId: "user-1",
    email: "founder@gmail.com",
  }),
  "/dashboard",
);

assert.equal(
  ownedSessionBusinesses(
    filterSessionBusinesses(demoRows, "founder@gmail.com"),
    "user-real",
  ).length,
  1,
);

assert.equal(
  resolvePostSignInLandingPath({
    businesses: [],
    clerkUserId: "user-new",
    email: "founder@gmail.com",
    requestedRedirect: "/onboarding",
  }),
  "/onboarding",
);

assert.equal(
  resolvePostSignInLandingPath({
    businesses: [
      {
        id: "shop-1",
        slug: "my-shop",
        ownerId: "user-1",
        onboardingState: { currentAct: "complete", completedActs: [], percentComplete: 100 },
        vertical: "hair",
      },
    ],
    clerkUserId: "user-1",
    email: "founder@gmail.com",
    requestedRedirect: "/onboarding",
  }),
  "/dashboard",
);

assert.equal(staffInviteMobileRedirectUrl(), "livia-mobile://staff-invite");
assert.equal(staffInviteMobileRedirectUrl("livia"), "livia://staff-invite");

console.log("registration-routing-program.test.ts OK");
