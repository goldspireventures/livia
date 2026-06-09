type InboxMessagesLayoutOpts = {
  /** Owner is replying — reserve space for compose + case actions. */
  ownerComposing?: boolean;
};

/** Min height for the scrollable message pane — grows with thread length, capped for long convos. */
export function inboxMessagesMinHeight(
  messageCount: number,
  opts?: InboxMessagesLayoutOpts,
): string {
  const n = Math.max(0, messageCount);
  if (opts?.ownerComposing) {
    if (n <= 4) return "min(8rem, 18vh)";
    if (n <= 10) return "min(12rem, 24vh)";
    return "min(16rem, 30vh)";
  }
  if (n <= 2) return "min(14rem, 28vh)";
  if (n <= 4) return "min(20rem, 38vh)";
  if (n <= 8) return "min(28rem, 48vh)";
  if (n <= 14) return "min(36rem, 58vh)";
  return "min(44rem, 65vh)";
}
