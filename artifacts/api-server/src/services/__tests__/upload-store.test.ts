import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  assertAllowedImageMime,
  storeBusinessImageUpload,
} from "../../lib/upload-store";

async function testUploadRoundTrip() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "livia-upload-"));
  process.env.UPLOAD_DIR = dir;
  process.env.PUBLIC_BASE_URL = "http://localhost:3000";

  assert.throws(() => assertAllowedImageMime("application/pdf"));

  const buffer = Buffer.from("fake-jpeg-bytes");
  const { url, path: rel } = await storeBusinessImageUpload({
    businessId: "biz_demo123",
    buffer,
    mimeType: "image/jpeg",
  });
  assert.ok(url.includes("/uploads/biz_demo123/"));
  assert.ok(rel.startsWith("biz_demo123/"));
  const onDisk = await readFile(path.join(dir, rel));
  assert.equal(onDisk.toString(), "fake-jpeg-bytes");
}

void testUploadRoundTrip().then(() => console.log("upload-store.test.ts ok"));
