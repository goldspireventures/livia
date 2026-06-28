import assert from "node:assert/strict";
import {
  STAFF_INVITE_JOBS,
  membershipToStaffInviteJob,
  personaFromInvitedMembership,
  resolveStaffInviteHandoff,
  resolveStaffInviteLandingPath,
  staffInviteClerkRedirectUrl,
  staffInviteJobToMembership,
  staffInviteWebRedirectUrl,
} from "../staff-invite-program.js";

assert.equal(STAFF_INVITE_JOBS.length, 3);

assert.deepEqual(staffInviteJobToMembership("floor"), { role: "STAFF" });
assert.deepEqual(staffInviteJobToMembership("manager"), {
  role: "ADMIN",
  deskRole: "manager",
});
assert.deepEqual(staffInviteJobToMembership("desk"), {
  role: "ADMIN",
  deskRole: "reception",
});

assert.equal(
  membershipToStaffInviteJob({ role: "STAFF" }),
  "floor",
);
assert.equal(
  membershipToStaffInviteJob({ role: "ADMIN", deskRole: "reception" }),
  "desk",
);
assert.equal(
  membershipToStaffInviteJob({ role: "ADMIN", deskRole: "manager" }),
  "manager",
);

assert.equal(personaFromInvitedMembership({ role: "STAFF" }), "staff");
assert.equal(
  personaFromInvitedMembership({ role: "ADMIN", deskRole: "manager" }),
  "manager",
);
assert.equal(
  personaFromInvitedMembership({ role: "ADMIN", deskRole: "reception" }),
  "receptionist",
);
assert.equal(personaFromInvitedMembership({ role: "OWNER" }), null);

assert.equal(
  resolveStaffInviteLandingPath({ surface: "web", persona: "staff" }),
  "/my-day",
);
assert.equal(
  resolveStaffInviteLandingPath({ surface: "web", persona: "manager" }),
  "/inbox",
);
assert.equal(
  resolveStaffInviteLandingPath({
    surface: "web",
    persona: "receptionist",
    vertical: "wellness",
  }),
  "/wellness-reception",
);
assert.equal(
  resolveStaffInviteLandingPath({ surface: "mobile", persona: "staff" }),
  "/(tabs)/my-day",
);
assert.equal(
  resolveStaffInviteLandingPath({ surface: "mobile", persona: "manager" }),
  "/(tabs)/approvals",
);

assert.equal(
  staffInviteWebRedirectUrl("https://app.livia-hq.com"),
  "https://app.livia-hq.com/staff-invite",
);
assert.equal(
  staffInviteClerkRedirectUrl("https://app.livia-hq.com/"),
  "https://app.livia-hq.com/staff-invite",
);

const floorHandoff = resolveStaffInviteHandoff({
  surface: "web",
  accepted: [
    {
      businessId: "b1",
      businessName: "Studio",
      role: "STAFF",
    },
  ],
  platformLegalAccepted: true,
});
assert.equal(floorHandoff.needsLegal, false);
assert.equal(floorHandoff.path, "/my-day");

const deskLegal = resolveStaffInviteHandoff({
  surface: "mobile",
  accepted: [
    {
      businessId: "b1",
      businessName: "Studio",
      role: "ADMIN",
      deskRole: "reception",
    },
  ],
  platformLegalAccepted: false,
});
assert.equal(deskLegal.needsLegal, true);
assert.equal(deskLegal.path, "/legal-acceptance?from=staff-invite");

console.log("staff-invite-program.test.ts OK");
