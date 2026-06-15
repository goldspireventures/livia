import assert from "node:assert/strict";
import {
  resolveRetailProductForService,
  buildPostSessionLivPreview,
} from "../tenant-retail-program";

const products = [
  { name: "Lash cleanser", category: "Aftercare", linkedServiceCategory: "Lashes" },
  { name: "Cuticle oil pen", category: "Nails", linkedServiceCategory: "Nails" },
];

const lash = resolveRetailProductForService({
  products,
  serviceCategory: "Lashes",
});
assert.equal(lash?.name, "Lash cleanser");

const nail = resolveRetailProductForService({
  products,
  serviceCategory: "Nails",
});
assert.equal(nail?.name, "Cuticle oil pen");

const preview = buildPostSessionLivPreview({
  vertical: "beauty",
  businessName: "Bloom Beauty Dublin",
  serviceName: "Lash fill",
  serviceCategory: "Lashes",
  products,
});
assert.ok(preview.body.includes("Lash cleanser"));
assert.ok(preview.body.includes("Lash fill"));
assert.ok(preview.caption.includes("Example"));

console.log("owner-liv-retail-match.test.ts OK");
