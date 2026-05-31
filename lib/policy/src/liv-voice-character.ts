/**
 * Liv voice character — modality-specific prompt blocks (not presentation preset).
 * @see docs/design/CHANNEL-UX-CONTRACT.md · docs/modality-and-locale.md
 */

export type LivChannelModality = "text" | "voice" | "sms";

export function resolveLivChannelModality(
  channelType?: string | null,
): LivChannelModality {
  const c = (channelType ?? "WEB").toUpperCase();
  if (c === "VOICE") return "voice";
  if (c === "SMS") return "sms";
  return "text";
}

/** Voice-line rules — short sentences, confirm spellings, no markdown. */
export function livVoiceCharacterBlock(modality: LivChannelModality): string {
  if (modality === "voice") {
    return `VOICE LINE RULES:
- Speak in short, natural sentences (one idea per breath).
- Confirm names, dates, and times aloud; spell unusual names if asked.
- Never use markdown, bullet lists, or URLs — offer to text a link instead.
- Pause before booking: repeat service, date, time, and name for explicit yes.
- Stay warm and unhurried; you are the shop's voice colleague, not a robot.`;
  }
  if (modality === "sms") {
    return `SMS RULES:
- Keep replies under ~320 characters when possible.
- One clear call-to-action per message.
- No markdown; plain text only.`;
  }
  return `TEXT CHAT RULES:
- Use brief paragraphs; bullets only when listing slots or options.
- Mirror the customer's language register without being stiff.`;
}
