import assert from "node:assert/strict";
import { getLivToolsForSurface, listLivToolMatrixRows } from "../liv-tool-matrix";
import { livVoiceCharacterBlock, resolveLivChannelModality } from "../liv-voice-character";

assert.ok(listLivToolMatrixRows().length >= 10, "tool matrix populated");
assert.equal(getLivToolsForSurface("tenant.inbox")[0]?.toolId, "send_message");
assert.deepEqual(
  getLivToolsForSurface("guest.public.hub").map((t) => t.toolId),
  [],
);

assert.equal(resolveLivChannelModality("VOICE"), "voice");
assert.equal(resolveLivChannelModality("SMS"), "sms");
assert.equal(resolveLivChannelModality("WEB"), "text");
assert.ok(livVoiceCharacterBlock("voice").includes("VOICE LINE RULES"));
assert.ok(livVoiceCharacterBlock("sms").includes("SMS RULES"));

console.log("liv-tool-matrix.test.ts: ok");
