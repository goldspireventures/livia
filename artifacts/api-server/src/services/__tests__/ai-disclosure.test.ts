// Runnable unit tests for EU AI Act Art. 50 disclosure semantics.
// Exercises the pure helpers (no DB) so prefix-once semantics, email block
// embedding, and copy presence are proven on every CI / local run.
//
// Run: `pnpm --filter @workspace/api-server run test`

import { strict as assert } from "node:assert";
import { AI_DISCLOSURE } from "@workspace/ai-disclosure";
import { applySmsPrefix, composeAiEmailBody } from "../ai-outbound.service";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    failed += 1;
  }
}

console.log("AI_DISCLOSURE copy contract");
test("chatFirstMessage identifies AI", () => {
  assert.match(AI_DISCLOSURE.chatFirstMessage("Acme"), /AI assistant/);
  assert.match(AI_DISCLOSURE.chatFirstMessage("Acme"), /Acme/);
});
test("chatFooterLine includes AI-assisted attribution", () => {
  assert.match(AI_DISCLOSURE.chatFooterLine, /AI-assisted/);
  assert.match(AI_DISCLOSURE.chatFooterLine, /Anthropic Claude/);
});
test("smsPrefix has Liv + AI assistant identity", () => {
  assert.ok(AI_DISCLOSURE.smsPrefix("Acme").startsWith("(Liv, AI assistant"));
  assert.match(AI_DISCLOSURE.smsPrefix("Acme"), /Acme/);
});
test("emailBlock identifies AI + invites human reply", () => {
  const block = AI_DISCLOSURE.emailBlock("Acme");
  assert.match(block, /AI assistant/);
  assert.match(block, /Reply to this email/);
});

console.log("\nSMS prefix-once semantics (applySmsPrefix)");
test("first message on thread gets the prefix", () => {
  const out = applySmsPrefix({
    isFirstOnThread: true,
    businessName: "Acme",
    content: "Booking confirmed for tomorrow 3pm.",
  });
  assert.ok(out.startsWith("(Liv, AI assistant for Acme) — "));
  assert.ok(out.endsWith("Booking confirmed for tomorrow 3pm."));
});
test("subsequent messages on same thread are NOT prefixed twice", () => {
  const out = applySmsPrefix({
    isFirstOnThread: false,
    businessName: "Acme",
    content: "See you then!",
  });
  assert.equal(out, "See you then!");
  assert.ok(!out.includes("(Liv, AI assistant"));
});
test("simulated thread: first send prefixed, second send raw", () => {
  // Caller's job: track isFirstOnThread via DB (sendAiSms does this). Here
  // we simulate the two states the caller will pass.
  const first = applySmsPrefix({
    isFirstOnThread: true,
    businessName: "Bliss Spa",
    content: "Massage at 2pm Sat.",
  });
  const second = applySmsPrefix({
    isFirstOnThread: false,
    businessName: "Bliss Spa",
    content: "Running 5 min late, sorry!",
  });
  // Prefix appears exactly once across the thread.
  const prefix = AI_DISCLOSURE.smsPrefix("Bliss Spa");
  const totalPrefixCount = (first.match(/Liv, AI assistant/g)?.length ?? 0) +
    (second.match(/Liv, AI assistant/g)?.length ?? 0);
  assert.equal(totalPrefixCount, 1, "prefix must appear exactly once per thread");
  assert.ok(first.startsWith(prefix));
  assert.ok(!second.startsWith(prefix));
});

console.log("\nEmail block embedding (composeAiEmailBody)");
test("disclosure block sits between body and signature", () => {
  const out = composeAiEmailBody({
    businessName: "Acme",
    body: "Your appointment is confirmed.",
    signature: "— The Acme team",
  });
  assert.ok(out.includes(AI_DISCLOSURE.emailBlock("Acme")));
  // Order: body → ---  → disclosure → signature
  const bodyIdx = out.indexOf("Your appointment is confirmed.");
  const discIdx = out.indexOf(AI_DISCLOSURE.emailBlock("Acme"));
  const sigIdx = out.indexOf("— The Acme team");
  assert.ok(bodyIdx < discIdx, "body must come before disclosure");
  assert.ok(discIdx < sigIdx, "disclosure must sit above signature");
});
test("works without signature", () => {
  const out = composeAiEmailBody({
    businessName: "Acme",
    body: "Your appointment is confirmed.",
  });
  assert.ok(out.includes(AI_DISCLOSURE.emailBlock("Acme")));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
