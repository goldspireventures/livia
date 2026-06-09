import assert from "node:assert/strict";
import {
  beautyShellNavItems,
  resolveBeautyShellActiveId,
  isBeautyOperatorShellVertical,
} from "../beauty-operator-shell";

assert.ok(isBeautyOperatorShellVertical("beauty"));
assert.equal(resolveBeautyShellActiveId("/services"), "treatments");

const nav = beautyShellNavItems("Treatments", "Team");
assert.ok(nav.studio.some((i) => i.href === "/services"));
assert.ok(nav.foreground.some((i) => i.id === "inbox"));

console.log("beauty-operator-shell.test.ts ok");
