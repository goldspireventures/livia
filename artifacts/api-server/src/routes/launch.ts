import { Router, type IRouter } from "express";
import { getLaunchReadiness } from "../services/launch-readiness.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();

/** Launch path tracker — product + ops checklist (local/staging). */
router.get("/launch/readiness", async (_req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production" && process.env.LIVIA_LAUNCH_STATUS_PUBLIC !== "true") {
    sendError(res, _req, 404, "Not found");
    return;
  }
  res.json(await getLaunchReadiness());
});

export default router;
