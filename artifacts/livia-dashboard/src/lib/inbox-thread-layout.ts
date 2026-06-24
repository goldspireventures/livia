type InboxMessagesLayoutOpts = {
  /** Owner is replying — reserve space for compose + case actions. */
  ownerComposing?: boolean;
};

/**
 * Floor for the message scroll pane. Flex layout owns most of the height;
 * keep this modest so 100% zoom still shows several bubbles.
 */
export function inboxMessagesMinHeight(
  messageCount: number,
  _opts?: InboxMessagesLayoutOpts,
): string | undefined {
  const n = Math.max(0, messageCount);
  if (n === 0) return "12rem";
  return undefined;
}
