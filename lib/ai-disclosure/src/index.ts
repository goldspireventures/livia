// Single source of truth for EU AI Act Art. 50 disclosure copy. Imported by
// the api-server (chat seed + outbound SMS/email composer) AND by the public
// chat widget (locked first bubble + persistent footer), so the customer's
// view and the owner's Inbox view cannot drift. Treated as legal text — not
// paraphrased, not overridable per-business.

export const AI_DISCLOSURE = {
  chatFirstMessage(businessName: string): string {
    return `Hi, I'm Liv — an AI assistant booking on behalf of ${businessName}. I keep notes for the team and a human can take over any time.`;
  },

  chatFooterLine: "AI-assisted by Liv · Powered by Anthropic Claude",

  smsPrefix(businessName: string): string {
    return `(Liv, AI assistant for ${businessName}) — `;
  },

  emailBlock(businessName: string): string {
    return `This message was drafted by Liv, an AI assistant for ${businessName}. Reply to this email and a human will respond.`;
  },

  /** Spoken at call start (English-IE). No call recording in v1 — disclosure only. */
  voiceOpeningLine(businessName: string): string {
    return `Hi, I'm Liv, an AI assistant for ${businessName}. This call may be handled by AI to help you book. Say what you'd like, or ask for a person.`;
  },
} as const;

export type AiDisclosure = typeof AI_DISCLOSURE;
