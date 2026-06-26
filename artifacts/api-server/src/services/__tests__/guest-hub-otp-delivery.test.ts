import assert from "node:assert/strict";
import test from "node:test";
import { deliverGuestHubOtp } from "../guest-hub-otp-delivery.service.ts";

test("deliverGuestHubOtp skips send when dev OTP exposed", async () => {
  const prev = process.env.LIVIA_STAGING_RELAXED;
  const prevEnv = process.env.LIVIA_DEPLOY_ENV;
  process.env.LIVIA_STAGING_RELAXED = "true";
  process.env.LIVIA_DEPLOY_ENV = "staging";
  try {
    const result = await deliverGuestHubOtp({
      channel: "email",
      email: "guest@example.com",
      code: "123456",
    });
    assert.equal(result.delivered, false);
  } finally {
    if (prev === undefined) delete process.env.LIVIA_STAGING_RELAXED;
    else process.env.LIVIA_STAGING_RELAXED = prev;
    if (prevEnv === undefined) delete process.env.LIVIA_DEPLOY_ENV;
    else process.env.LIVIA_DEPLOY_ENV = prevEnv;
  }
});
