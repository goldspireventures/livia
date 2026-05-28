import { serve } from "inngest/express";
import { inngest } from "../lib/inngest";
import { workflowFunctions } from "../workflows";

export default serve({
  client: inngest,
  functions: workflowFunctions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
