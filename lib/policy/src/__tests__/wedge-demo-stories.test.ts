import assert from "node:assert/strict";
import { listWedgeDemoVerticalsForDisplay } from "../wedge-demo-stories";

const list = listWedgeDemoVerticalsForDisplay();
assert.ok(list.length > 2, "wedge display list populated");
assert.equal(list[0], "body-art", "body-art first for GTM");
assert.equal(list[list.length - 1], "hair", "hair last on grid");

console.log("wedge-demo-stories.test.ts: ok");
