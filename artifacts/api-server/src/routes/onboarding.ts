import { Router, type IRouter } from "express";
import {
  listJurisdictionCatalog,
  listVerticalCatalog,
  resolveOnboardingDefaults,
  businessTierSchema,
  businessVerticalSchema,
  jurisdictionCodeSchema,
} from "@workspace/policy";
import { requireAuth } from "../lib/auth";
import { sendError } from "../lib/http-errors";

const router: IRouter = Router();

router.get("/onboarding/catalog", requireAuth, (_req, res) => {
  res.json({
    jurisdictions: listJurisdictionCatalog(),
    verticals: listVerticalCatalog(),
    tiers: businessTierSchema.options,
  });
});

router.post("/onboarding/preview", requireAuth, (req, res) => {
  const { name, country, category, vertical, tier, jurisdiction } = req.body ?? {};
  if (!name || typeof name !== "string") {
    sendError(res, req, 400, "name is required");
    return;
  }

  const countryIso =
    jurisdiction && jurisdictionCodeSchema.safeParse(jurisdiction).success
      ? jurisdictionCodeSchema.parse(jurisdiction)
      : country;

  const defaults = resolveOnboardingDefaults({
    name,
    country: typeof countryIso === "string" && countryIso.length === 2 ? countryIso : country,
    category,
    vertical:
      vertical && businessVerticalSchema.safeParse(vertical).success
        ? businessVerticalSchema.parse(vertical)
        : undefined,
    tier:
      tier && businessTierSchema.safeParse(tier).success
        ? businessTierSchema.parse(tier)
        : undefined,
  });

  res.json(defaults);
});

export default router;
