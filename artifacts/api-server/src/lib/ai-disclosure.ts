// Re-export of the shared disclosure copy. Kept as a thin module so existing
// imports (`../lib/ai-disclosure`) keep working; the canonical source lives
// in `@workspace/ai-disclosure` and is shared with the dashboard widget so
// drift is structurally impossible.
export { AI_DISCLOSURE, type AiDisclosure } from "@workspace/ai-disclosure";
