import assert from "node:assert/strict";
import test from "node:test";
import { classifyMarketingHost } from "../marketing-surface-program.ts";

test("livia-hq.com is production marketing surface", () => {
  assert.equal(classifyMarketingHost("livia-hq.com"), "production");
  assert.equal(classifyMarketingHost("www.livia-hq.com"), "production");
});

test("staging marketing hosts stay on staging tier", () => {
  assert.equal(classifyMarketingHost("staging.livia-hq.com"), "staging");
  assert.equal(classifyMarketingHost("app.staging.livia-hq.com"), "staging");
});

test("localhost is local tier", () => {
  assert.equal(classifyMarketingHost("localhost"), "local");
});
