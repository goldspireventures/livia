import assert from "node:assert/strict";

const headers: Record<string, string | number> = {};
const body: { chunks: string[] } = { chunks: [] };

let statusCode = 0;
const res = {
  status(code: number) {
    statusCode = code;
    return res;
  },
  json(payload: unknown) {
    body.chunks.push(JSON.stringify(payload));
    return res;
  },
} as unknown as import("express").Response;

const req = { id: "req-test-123" } as import("express").Request & { id: string };

const { sendError, getRequestId } = await import("../../lib/http-errors.js");

assert.equal(getRequestId(req), "req-test-123");
sendError(res, req, 409, "Slug already taken", { code: "SLUG_TAKEN" });
assert.equal(statusCode, 409);
const parsed = JSON.parse(body.chunks[0]!) as {
  error: string;
  requestId: string;
  code: string;
};
assert.equal(parsed.error, "Slug already taken");
assert.equal(parsed.requestId, "req-test-123");
assert.equal(parsed.code, "SLUG_TAKEN");

console.log("http-errors.test.ts: ok");
