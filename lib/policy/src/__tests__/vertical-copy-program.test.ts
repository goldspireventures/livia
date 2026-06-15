import assert from "node:assert/strict";
import { businessVerticalSchema } from "../types";
import {
  validateAllVerticalCopyPrograms,
  validateVerticalCopyProgram,
  VERTICAL_COPY_SURFACES,
} from "../vertical-copy-program";

for (const vertical of businessVerticalSchema.options) {
  const result = validateVerticalCopyProgram(vertical);
  assert.equal(
    result.ok,
    true,
    `${vertical} copy program failed:\n${result.errors.join("\n")}`,
  );
}

const all = validateAllVerticalCopyPrograms();
assert.equal(all.length, businessVerticalSchema.options.length);
assert.ok(all.every((r) => r.ok));

assert.equal(VERTICAL_COPY_SURFACES.length >= 7, true);

console.log("vertical-copy-program.test.ts ok");
