// Compile-time coverage check for EU AI Act Art. 50 disclosure surfaces.
// Type-checked but not executed at runtime. If a future commit adds a raw
// SMS/email send that bypasses the composer, the typeof pins below will
// surface in review.

import { AI_DISCLOSURE } from "@workspace/ai-disclosure";
import { composeAiEmailBody, sendAiSms, sendAiEmail } from "../ai-outbound.service";

const _chatFirst: string = AI_DISCLOSURE.chatFirstMessage("Acme");
const _chatFooter: string = AI_DISCLOSURE.chatFooterLine;
const _smsPrefix: string = AI_DISCLOSURE.smsPrefix("Acme");
const _emailBlock: string = AI_DISCLOSURE.emailBlock("Acme");

if (!_chatFirst.includes("AI assistant")) throw new Error("chat disclosure missing AI identity");
if (!_chatFooter.includes("AI-assisted")) throw new Error("chat footer missing AI identity");
if (!_smsPrefix.startsWith("(Liv, AI assistant")) throw new Error("SMS prefix shape changed");
if (!_emailBlock.includes("AI assistant")) throw new Error("email block missing AI identity");

const sample = composeAiEmailBody({
  businessName: "Acme",
  body: "Your appointment is confirmed.",
  signature: "— The Acme team",
});
if (!sample.includes(AI_DISCLOSURE.emailBlock("Acme"))) {
  throw new Error("composeAiEmailBody did not embed the disclosure block");
}

type _SmsSender = typeof sendAiSms;
type _EmailSender = typeof sendAiEmail;

export {};
