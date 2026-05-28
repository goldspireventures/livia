import { Inngest } from "inngest";

export const INNGEST_APP_ID = "livia";

export const inngest = new Inngest({
  id: INNGEST_APP_ID,
  eventKey: process.env.INNGEST_EVENT_KEY,
});

/** True when we should route domain events to Inngest (not cron-only fallback). */
export function isInngestWorkflowsEnabled(): boolean {
  if (process.env.WORKFLOWS_DISABLED === "true") return false;
  return !!(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === "1");
}
