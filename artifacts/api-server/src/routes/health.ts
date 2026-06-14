import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { resolveSideEffectMode } from "@workspace/policy";
import { getSubsystemCircuitHealth } from "../lib/subsystem-circuit";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/** Readiness detail — side-effect subsystem state (ops / monitoring). */
router.get("/healthz/subsystems", (_req, res) => {
  const circuits = getSubsystemCircuitHealth();
  const mode = resolveSideEffectMode();
  const anyOpen = Object.values(circuits).some((c) => c.state === "open");
  res.json({
    status: mode === "disabled" ? "degraded" : anyOpen ? "degraded" : "ok",
    sideEffectsMode: mode,
    circuits,
  });
});

export default router;
