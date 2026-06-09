import assert from "node:assert/strict";
import {
  beautyShellNavItems,
  resolveBeautyOperatorCssPreset,
  BEAUTY_OPERATOR_DEFAULT_CSS_PRESET,
  resolveBeautyShellActiveId,
  isBeautyOperatorShellVertical,
} from "../beauty-operator-shell";

assert.equal(resolveBeautyOperatorCssPreset(null), BEAUTY_OPERATOR_DEFAULT_CSS_PRESET);
assert.equal(resolveBeautyOperatorCssPreset("platform-default"), BEAUTY_OPERATOR_DEFAULT_CSS_PRESET);
assert.equal(resolveBeautyOperatorCssPreset("soft-studio"), "soft-studio");

assert.ok(isBeautyOperatorShellVertical("beauty"));
assert.equal(resolveBeautyShellActiveId("/services"), "treatments");

const nav = beautyShellNavItems("Treatments", "Team");
assert.ok(nav.studio.some((i) => i.href === "/services"));
assert.ok(nav.foreground.some((i) => i.id === "inbox"));

console.log("beauty-operator-shell.test.ts ok");
