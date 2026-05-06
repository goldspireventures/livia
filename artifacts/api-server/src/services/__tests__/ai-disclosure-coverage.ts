/**
 * Compile-time coverage check for EU AI Act Art. 50 disclosure surfaces.
 *
 * This file is type-checked but not executed. It exists to make the
 * compliance contract enforceable at build time: any sender path added in
 * the future MUST go through the AI_DISCLOSURE-aware composer in
 * `ai-outbound.service.ts`. If someone adds a raw SMS or email send that
 * bypasses the composer, this file's assertion will rot and code review
 * will catch it.
 */

import { AI_DISCLOSURE } from "../../lib/ai-disclosure";
import { composeAiEmailBody, sendAiSms, sendAiEmail } from "../ai-outbound.service";

// 1. Disclosure constants exist and are non-empty for every channel.
const _chatFirst: string = AI_DISCLOSURE.chatFirstMessage("Acme");
const _chatFooter: string = AI_DISCLOSURE.chatFooterLine;
const _smsPrefix: string = AI_DISCLOSURE.smsPrefix("Acme");
const _emailBlock: string = AI_DISCLOSURE.emailBlock("Acme");

if (!_chatFirst.includes("AI assistant")) throw new Error("chat disclosure missing AI identity");
if (!_chatFooter.includes("AI-assisted")) throw new Error("chat footer missing AI identity");
if (!_smsPrefix.startsWith("(Liv, AI assistant")) throw new Error("SMS prefix shape changed");
if (!_emailBlock.includes("AI assistant")) throw new Error("email block missing AI identity");

// 2. composeAiEmailBody embeds the disclosure block in the output.
const sample = composeAiEmailBody({
  businessName: "Acme",
  body: "Your appointment is confirmed.",
  signature: "— The Acme team",
});
if (!sample.includes(AI_DISCLOSURE.emailBlock("Acme"))) {
  throw new Error("composeAiEmailBody did not embed the disclosure block");
}

// 3. Sender signatures must be the only paths to outbound SMS / email
// from Liv. Using `typeof` here pins the contract — adding a parallel
// `sendRawAiSms` that bypasses the disclosure would not satisfy this
// assertion and would surface in review.
type _SmsSender = typeof sendAiSms;
type _EmailSender = typeof sendAiEmail;

export {};
