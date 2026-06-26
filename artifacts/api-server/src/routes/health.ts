import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { resolveSideEffectMode } from "@workspace/policy";
import { getSubsystemCircuitHealth } from "../lib/subsystem-circuit";
import { getBetaSignupMode } from "../lib/beta-signup-gate";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/** Public — marketing sign-up UX reads closed-beta mode without auth. */
router.get("/public/signup-gate", (_req, res) => {
  res.json({
    mode: getBetaSignupMode(),
    publicPaidOnboarding: process.env.LIVIA_PUBLIC_PAID_ONBOARDING === "true",
  });
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
