import assert from "node:assert/strict";
import { getSignInAppearanceHintForEmail } from "../sign-in-appearance-hint.service";

assert.equal(await getSignInAppearanceHintForEmail(""), null);
assert.equal(await getSignInAppearanceHintForEmail("not-an-email"), null);
assert.equal(await getSignInAppearanceHintForEmail("unknown@example.com"), null);

console.log("sign-in-appearance-hint.test.ts: ok");
