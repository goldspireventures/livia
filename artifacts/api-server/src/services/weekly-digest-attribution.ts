const LIV_SOURCES = ["voice", "whatsapp", "sms", "web", "instagram", "messenger", "email"] as const;

/** Liv-attributed booking heuristic for weekly digest stats. */
export function isLivAttributedBooking(row: {
  source: string;
  sourceConversationId: string | null;
}): boolean {
  return (
    (LIV_SOURCES as readonly string[]).includes(row.source) &&
    (row.sourceConversationId != null || row.source === "voice")
  );
}
