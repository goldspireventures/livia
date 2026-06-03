import assert from "node:assert/strict";
import { isMarketingDemoLeadIntent } from "../marketing-demo-gate";

assert.equal(
  isMarketingDemoLeadIntent({ source: "livia-hq.com/book-demo", utmSource: "demo:beauty" }),
  true,
);
assert.equal(isMarketingDemoLeadIntent({ source: "livia-hq.com", utmSource: "vertical:hair" }), false);
assert.equal(isMarketingDemoLeadIntent({ source: "livia-hq.com", utmSource: "demo-request" }), true);

console.log("marketing-demo-gate.test.ts: ok");
