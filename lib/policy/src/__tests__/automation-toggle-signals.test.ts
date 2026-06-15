import assert from "node:assert/strict";
import {
  recordAutomationToggleSignals,
  persistentlyDisabledAutomationToggles,
} from "../automation-toggle-signals";
import { AFTERCARE_MODE_OWNER_COPY, OWNER_LIV_TAGLINE } from "../owner-liv-ownership";

const signals = recordAutomationToggleSignals(undefined, {
  "guestCare.aftercareEnabled": false,
  "retail.enabled": false,
});
assert.equal(signals["guestCare.aftercareEnabled"]?.persistentlyOff, true);
assert.equal(signals["guestCare.aftercareEnabled"]?.everActivated, false);

const activated = recordAutomationToggleSignals(signals, {
  "guestCare.aftercareEnabled": true,
});
assert.equal(activated["guestCare.aftercareEnabled"]?.everActivated, true);
assert.equal(activated["guestCare.aftercareEnabled"]?.persistentlyOff, false);

const offAgain = recordAutomationToggleSignals(activated, {
  "guestCare.aftercareEnabled": false,
});
assert.equal(offAgain["guestCare.aftercareEnabled"]?.everActivated, true);
assert.equal(offAgain["guestCare.aftercareEnabled"]?.persistentlyOff, false);

const disabled = persistentlyDisabledAutomationToggles({
  "retail.postSessionSuggest": {
    value: false,
    updatedAt: "2026-01-01",
    everActivated: false,
    persistentlyOff: true,
  },
});
assert.deepEqual(disabled, ["retail.postSessionSuggest"]);

assert.ok(AFTERCARE_MODE_OWNER_COPY.liv_draft.label.includes("draft"));
assert.ok(OWNER_LIV_TAGLINE.includes("Liv"));

console.log("automation-toggle-signals.test.ts OK");
