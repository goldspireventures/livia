import assert from "node:assert/strict";
import { resolveMigrationAutomationTruth } from "../migration-automation-truth";

const freshaNoEnv = resolveMigrationAutomationTruth("fresha", { oauthLive: false });
assert.equal(freshaNoEnv?.tier, "oauth_not_configured");
assert.equal(freshaNoEnv?.showConnectButton, false);

const freshaLive = resolveMigrationAutomationTruth("fresha", { oauthLive: true, oauthConnected: true });
assert.equal(freshaLive?.tier, "oauth_live");
assert.equal(freshaLive?.showConnectButton, true);

const booksy = resolveMigrationAutomationTruth("booksy", {});
assert.equal(booksy?.tier, "file_only");
assert.equal(booksy?.showConnectButton, false);
assert.ok(booksy?.honestLimit.includes("no connect API"));

const phorest = resolveMigrationAutomationTruth("phorest", {});
assert.equal(phorest?.tier, "partner_not_built");

const phorestLive = resolveMigrationAutomationTruth("phorest", { partnerLive: true });
assert.equal(phorestLive?.tier, "partner_live");
assert.equal(phorestLive?.showConnectButton, true);

console.log("migration-automation-truth.test.ts ok");
