import assert from "node:assert/strict";
import { isDemoPortalEnabled, demoResponsesMayIncludeSecrets } from "../../lib/demo-portal-config";
import { toPublicStaffDto } from "../../lib/public-staff-dto";
import { twilioSignatureRequired, requireWebhookSecretInProduction } from "../../lib/webhook-guard";

const prev = { ...process.env };

function restoreEnv() {
  for (const k of Object.keys(process.env)) {
    if (!(k in prev)) delete process.env[k];
  }
  Object.assign(process.env, prev);
}

try {
  process.env.NODE_ENV = "production";
  process.env.LIVIA_DEMO_ENABLED = "true";
  delete process.env.LIVIA_DEMO_ALLOW_IN_PRODUCTION;
  assert.equal(isDemoPortalEnabled(), false, "demo must be off in prod without explicit allow");

  process.env.LIVIA_DEMO_ALLOW_IN_PRODUCTION = "true";
  assert.equal(isDemoPortalEnabled(), true);

  delete process.env.LIVIA_DEMO_ALLOW_IN_PRODUCTION;
  process.env.LIVIA_DEPLOY_ENV = "staging";
  assert.equal(isDemoPortalEnabled(), true, "staging deploy env enables demo without prod allow flag");

  delete process.env.LIVIA_DEPLOY_ENV;
  assert.equal(isDemoPortalEnabled(), false, "prod without allow stays off");

  assert.equal(demoResponsesMayIncludeSecrets(), false);

  const dto = toPublicStaffDto({
    id: "s1",
    displayName: "Alex",
    email: "hidden@example.com",
    phone: "+353",
    userId: "u1",
    bio: "Stylist",
    photoUrl: null,
  } as Parameters<typeof toPublicStaffDto>[0]);
  assert.equal((dto as { email?: string }).email, undefined);

  process.env.TWILIO_SKIP_SIGNATURE_VALIDATION = "true";
  assert.equal(twilioSignatureRequired(), false);

  delete process.env.TWILIO_SKIP_SIGNATURE_VALIDATION;
  delete process.env.TWILIO_AUTH_TOKEN;
  assert.equal(twilioSignatureRequired(), false);

  process.env.TWILIO_AUTH_TOKEN = "tok";
  assert.equal(twilioSignatureRequired(), true);

  delete process.env.META_APP_SECRET;
  assert.equal(requireWebhookSecretInProduction("META_APP_SECRET"), false);

  process.env.META_APP_SECRET = "secret";
  assert.equal(requireWebhookSecretInProduction("META_APP_SECRET"), true);

  console.log("production-security.test.ts: ok");
} finally {
  restoreEnv();
}
