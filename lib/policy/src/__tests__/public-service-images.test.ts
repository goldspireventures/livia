import assert from "node:assert/strict";
import {
  inferPublicServiceImageFromName,
  resolvePublicServiceImageUrl,
  STALE_PUBLIC_SERVICE_IMAGE,
} from "../public-service-images";

assert.match(inferPublicServiceImageFromName("Brow shape")!, /1583001931096/);
assert.match(inferPublicServiceImageFromName("Lash fill")!, /1516975080664/);

assert.equal(
  resolvePublicServiceImageUrl(
    "Brow shape",
    undefined,
    "https://images.unsplash.com/photo-1487412940907-6530b50e3063?w=400",
  )!.includes("1583001931096"),
  true,
);

assert.ok(STALE_PUBLIC_SERVICE_IMAGE.test("photo-1487412940907"));

console.log("public-service-images.test: ok");
