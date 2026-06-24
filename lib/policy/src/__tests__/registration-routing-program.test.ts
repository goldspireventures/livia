import assert from "node:assert/strict";
import {
  filterSessionBusinesses,
  isDemoWorldSlug,
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

console.log("registration-routing-program.test.ts OK");
