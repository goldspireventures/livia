import assert from "node:assert/strict";
import { mergePublicLivChatOpening, stripRedundantLivIntro } from "../public-liv-chat-opening";

const disclosure =
  "Hi, I'm Liv — an AI assistant booking on behalf of IMD Allied Health. I keep notes for the team and a human can take over any time.";

const defaultGreeting =
  "Hi! I'm Liv, the AI assistant for IMD Allied Health. I can help you book an appointment — what are you looking for today?";

assert.equal(
  mergePublicLivChatOpening(disclosure, defaultGreeting),
  `${disclosure}\n\nI can help you book an appointment — what are you looking for today?`,
);

assert.equal(mergePublicLivChatOpening(disclosure, undefined), disclosure);

assert.equal(
  mergePublicLivChatOpening(disclosure, "Spring package specials this month — ask me what's included."),
  `${disclosure}\n\nSpring package specials this month — ask me what's included.`,
);

assert.equal(
  stripRedundantLivIntro("Hi! I'm Liv, the AI assistant for Acme. I can help you book."),
  "I can help you book.",
);

console.log("public-liv-chat-opening.test.ts ok");
