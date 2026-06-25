import assert from "node:assert/strict";
import {
  filterSessionBusinesses,
  isDemoWorldSlug,
  ownedSessionBusinesses,
  pickOnboardingResumeBusiness,
  pickPrimarySessionBusiness,
  resolvePostLegalDestination,
} from "../registration-routing-program";

assert.equal(isDemoWorldSlug("dublin-barber-collective"), true);
assert.equal(isDemoWorldSlug("my-real-shop"), false);

const demoRows = [
  { id: "1", slug: "dublin-barber-collective", ownerId: "owner-demo" },
  { id: "2", slug: "my-salon", ownerId: "user-real" },
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

assert.equal(
  ownedSessionBusinesses(
    filterSessionBusinesses(demoRows, "founder@gmail.com"),
    "user-real",
  ).length,
  1,
);

console.log("registration-routing-program.test.ts OK");
