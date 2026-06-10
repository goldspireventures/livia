import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { requireAuth, getUserId } from "../lib/auth";
import { logger } from "../lib/logger";
import { isDemoPortalEnabled } from "../lib/demo-portal-config";
import {
  assertDemoSignInAllowed,
  formatClerkDemoError,
  getDemoCatalog,
  getDemoPortalStatus,
  provisionDemoWorld,
  syncDemoWorld,
  syncDemoLogins,
  signInAsDemoBusiness,
  signInAsDemoEmail,
  signInAsDemoPersona,
  syncAllDemoClerkUsers,
  syncVerticalShowcaseForDemo,
  quickDemoSignIn,
} from "../services/demo-portal.service";

import { guestBookTokenPath } from "@workspace/policy";
import { resolveGuestTokenUrl } from "../lib/guest-public-urls";
import { sendError } from "../lib/http-errors";
const router: IRouter = Router();

function demoGuestSurfacePayload(
  slug: string,
  surface: "proof" | "pay" | "intake" | "waitlist",
  token: string,
) {
  return {
    slug,
    token,
    path: guestBookTokenPath(slug, surface, token),
    url: resolveGuestTokenUrl(slug, surface, token),
  };
}

function gate(_req: Request, res: Response, next: NextFunction) {
  if (!isDemoPortalEnabled()) {
    sendError(res, _req, 404, "Not found");
    return;
  }
  next();
}

router.use(gate);

router.get("/demo/catalog", (_req, res) => {
  res.json(getDemoCatalog());
});

router.get("/demo/status", async (_req, res) => {
  res.json(await getDemoPortalStatus());
});

/** CI / local: DB-only vertical showcase (no Clerk). */
router.post("/demo/seed-ci-db", async (req, res): Promise<void> => {
  if (process.env.CI !== "true" && process.env.NODE_ENV === "production") {
    sendError(res, req, 404, "Not found");
    return;
  }
  try {
    const { seedCiDemoWorld } = await import("../services/demo-ci-seed.service");
    const status = await seedCiDemoWorld();
    res.json({ ok: true, provisioned: status.provisioned, businessCount: status.businesses.length });
  } catch (e: unknown) {
    const err = e as Error;
    sendError(res, req, 500, err.message ?? "CI demo seed failed");
  }
});

/** Idempotent: Clerk users + Aurora demo world (4 businesses, 6 staff logins). */
router.post("/demo/provision", async (req, res): Promise<void> => {
  const requestId = (req as Request & { id?: string }).id;
  const started = Date.now();
  try {
    const result = await provisionDemoWorld();
    logger.info(
      {
        event: "demo.provision.ok",
        request_id: requestId,
        business_count: result.businesses.length,
        persona_count: result.personas.length,
        duration_ms: Date.now() - started,
        slugs: result.businesses.map((b) => b.slug),
      },
      "Demo world provisioned",
    );
    res.json(result);
  } catch (e: unknown) {
    const err = formatClerkDemoError(e) as Error & { code?: string; status?: number };
    logger.error(
      {
        event: "demo.provision.failed",
        request_id: requestId,
        duration_ms: Date.now() - started,
        code: err.code,
        err,
      },
      "Demo world provision failed",
    );
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    if (err.code === "CLERK_USER_QUOTA" || err.code === "CLERK_FORBIDDEN") {
      sendError(res, req, err.status ?? 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, 500, err.message ?? "Provision failed");
  }
});

/** Repair path when Clerk dev quota blocks new users — seeds DB, reuses existing demo Clerk accounts. */
router.post("/demo/repair-db", async (req, res): Promise<void> => {
  const requestId = (req as Request & { id?: string }).id;
  const started = Date.now();
  try {
    const result = await provisionDemoWorld({ repair: true });
    logger.info(
      {
        event: "demo.repair.ok",
        request_id: requestId,
        business_count: result.businesses.length,
        duration_ms: Date.now() - started,
      },
      "Demo world repaired (DB seed, existing Clerk users)",
    );
    res.json(result);
  } catch (e: unknown) {
    const err = formatClerkDemoError(e) as Error & { code?: string; status?: number };
    logger.error(
      { event: "demo.repair.failed", request_id: requestId, err },
      "Demo repair failed",
    );
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, err.status ?? 500, err.message ?? "Repair failed");
  }
});

/** Re-seed demo guest vault + operator Liv world (idempotent). */
router.post("/demo/sync-guest-hub", async (req, res): Promise<void> => {
  const requestId = (req as Request & { id?: string }).id;
  try {
    const { seedDemoGuestHub } = await import("../services/demo-guest-hub.seed");
    const guestHub = await seedDemoGuestHub();
    const { seedOperatorLivWorld } = await import("../services/demo-operator-liv-world.seed");
    const operatorLiv = await seedOperatorLivWorld();
    logger.info(
      { event: "demo.guest_hub.sync.ok", request_id: requestId, ...guestHub, operatorLiv },
      "Guest hub + operator Liv seeded",
    );
    res.json({ ok: true, ...guestHub, operatorLiv });
  } catch (e: unknown) {
    const err = e as Error;
    logger.error({ event: "demo.guest_hub.sync.failed", request_id: requestId, err }, "Guest hub seed failed");
    sendError(res, req, 500, err.message ?? "Guest hub seed failed");
  }
});

/** Programmatic check — three end clients + operator Liv depth (no Clerk auth). */
router.get("/demo/liv-world-check", async (_req, res): Promise<void> => {
  try {
    const { verifyDemoGuestWorld } = await import("../services/demo-guest-world.verify");
    const report = await verifyDemoGuestWorld();
    res.status(report.ok ? 200 : 503).json(report);
  } catch (e: unknown) {
    const err = e as Error;
    sendError(res, _req, 500, err.message ?? "Liv world check failed");
  }
});

/** Re-seed operator inbox + briefings only. */
router.post("/demo/sync-operator-liv", async (req, res): Promise<void> => {
  const requestId = (req as Request & { id?: string }).id;
  try {
    const { seedOperatorLivWorld } = await import("../services/demo-operator-liv-world.seed");
    const operatorLiv = await seedOperatorLivWorld();
    logger.info({ event: "demo.operator_liv.sync.ok", request_id: requestId, operatorLiv }, "Operator Liv synced");
    res.json({ ok: true, operatorLiv });
  } catch (e: unknown) {
    const err = e as Error;
    sendError(res, req, 500, err.message ?? "Operator Liv sync failed");
  }
});

/** Fast sync — branding + service images only (~3–8s). No Clerk. */
router.post("/demo/sync", async (req, res): Promise<void> => {
  const requestId = (req as Request & { id?: string }).id;
  const started = Date.now();
  try {
    const result = await syncDemoWorld();
    logger.info(
      {
        event: "demo.sync.ok",
        request_id: requestId,
        mode: result.mode,
        duration_ms: Date.now() - started,
        services_updated: result.servicesUpdated,
        branding_updated: result.brandingUpdated,
      },
      "Demo world synced",
    );
    res.json(result);
  } catch (e: unknown) {
    const err = e as Error & { code?: string; status?: number };
    logger.error(
      {
        event: "demo.sync.failed",
        request_id: requestId,
        duration_ms: Date.now() - started,
        err,
      },
      "Demo sync failed",
    );
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, 500, err.message ?? "Sync failed");
  }
});

/** Refresh Clerk passwords + role memberships. Pass { slug } to sync one tenant (~5s). */
router.post("/demo/sync-logins", async (req, res): Promise<void> => {
  try {
    const slug = typeof req.body?.slug === "string" ? req.body.slug : undefined;
    res.json(await syncDemoLogins({ slug }));
  } catch (e: unknown) {
    const err = e as Error & { code?: string };
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, 500, err.message ?? "Login sync failed");
  }
});

/** Add missing vertical showcase shops without wiping demo world. */
router.post("/demo/sync-vertical-showcase", async (req, res): Promise<void> => {
  try {
    res.json(await syncVerticalShowcaseForDemo());
  } catch (e: unknown) {
    const err = e as Error & { status?: number; code?: string };
    if (err.status === 409) {
      sendError(res, req, 409, err.message);
      return;
    }
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, 500, err.message ?? "Sync failed");
  }
});

/** Demo-only: guest proof token for E2E / GTM walkthroughs (body-art). */
router.get("/demo/guest-surfaces/:slug/proof", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "").trim();
  if (!slug) {
    sendError(res, req, 400, "slug is required");
    return;
  }
  const { getDemoGuestProofToken } = await import("../services/demo-showcase-depth");
  const token = await getDemoGuestProofToken(slug);
  if (!token) {
    sendError(res, req, 404, "No pending guest proof for this demo shop");
    return;
  }
  res.json(demoGuestSurfacePayload(slug, "proof", token));
});

/** Demo-only: guest intake token for E2E / medspa walkthroughs. */
router.get("/demo/guest-surfaces/:slug/pay", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "").trim();
  if (!slug) {
    sendError(res, req, 400, "slug is required");
    return;
  }
  const { getDemoGuestPayToken } = await import("../services/demo-showcase-depth");
  const token = await getDemoGuestPayToken(slug);
  if (!token) {
    sendError(res, req, 404, "No pending deposit booking for this demo shop");
    return;
  }
  res.json(demoGuestSurfacePayload(slug, "pay", token));
});

router.get("/demo/guest-surfaces/:slug/intake", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "").trim();
  if (!slug) {
    sendError(res, req, 400, "slug is required");
    return;
  }
  const { getDemoGuestIntakeToken } = await import("../services/demo-showcase-depth");
  const token = await getDemoGuestIntakeToken(slug);
  if (!token) {
    sendError(res, req, 404, "No draft guest intake for this demo shop");
    return;
  }
  res.json(demoGuestSurfacePayload(slug, "intake", token));
});

/** Demo-only: waitlist accept token (fitness / slot waitlist). */
router.get("/demo/guest-surfaces/:slug/waitlist", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "").trim();
  if (!slug) {
    sendError(res, req, 400, "slug is required");
    return;
  }
  const { getDemoGuestWaitlistToken } = await import("../services/demo-showcase-depth");
  const token = await getDemoGuestWaitlistToken(slug);
  if (!token) {
    sendError(res, req, 404, "No waitlist offer for this demo shop");
    return;
  }
  res.json({
    ...demoGuestSurfacePayload(slug, "waitlist", token),
  });
});

/**
 * One-tap persona sign-in (Clerk ticket). In dev, no prior auth required.
 * Production: LIVIA_DEMO_ENABLED + caller email must be demo/@livia.io.
 */
/**
 * Email + shared demo password → Clerk ticket (skips Client Trust / extra verification UI).
 * Dev: no auth. Production: LIVIA_DEMO_ENABLED only.
 */
/** One-click: enter as owner of a single business (tenant tour). */
router.post("/demo/sign-in-business", async (req, res): Promise<void> => {
  const slug = String(req.body?.slug ?? "").trim();
  if (!slug) {
    sendError(res, req, 400, "slug is required");
    return;
  }
  try {
    res.json(await signInAsDemoBusiness(slug));
  } catch (e: unknown) {
    const err = e as Error & { status?: number; code?: string };
    if (err.status === 404 || err.status === 409) {
      sendError(res, req, err.status, err.message);
      return;
    }
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, 500, err.message ?? "Sign-in failed");
  }
});

router.post("/demo/sign-in-email", async (req, res): Promise<void> => {
  const email = String(req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");
  if (!email || !password) {
    sendError(res, req, 400, "email and password are required");
    return;
  }

  if (process.env.NODE_ENV === "production" && process.env.LIVIA_DEMO_ENABLED !== "true") {
    sendError(res, req, 404, "Not found");
    return;
  }

  try {
    const out = await signInAsDemoEmail({ email, password });
    res.json(out);
  } catch (e: unknown) {
    const err = e as Error & { status?: number; code?: string };
    if (err.status === 401 || err.status === 403 || err.status === 409) {
      sendError(res, req, err.status, err.message);
      return;
    }
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, 500, err.message ?? "Sign-in failed");
  }
});

/** One-click demo login — server applies shared password (staging internal only). */
router.post("/demo/quick-sign-in", async (req, res): Promise<void> => {
  const email = String(req.body?.email ?? "").trim();
  if (!email) {
    sendError(res, req, 400, "email is required");
    return;
  }

  if (process.env.NODE_ENV === "production" && process.env.LIVIA_DEMO_ENABLED !== "true") {
    sendError(res, req, 404, "Not found");
    return;
  }

  try {
    res.json(await quickDemoSignIn(email));
  } catch (e: unknown) {
    const err = e as Error & { status?: number; code?: string };
    if (err.status === 401 || err.status === 403 || err.status === 409) {
      sendError(res, req, err.status, err.message);
      return;
    }
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, 500, err.message ?? "Sign-in failed");
  }
});

/** Re-verify passwords + disable MFA on all demo Clerk users without wiping data. */
router.post("/demo/sync-clerk", async (_req, res): Promise<void> => {
  try {
    res.json(await syncAllDemoClerkUsers());
  } catch (e: unknown) {
    const err = e as Error & { code?: string };
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, _req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, _req, 500, err.message ?? "Sync failed");
  }
});

router.post("/demo/sign-in", async (req, res): Promise<void> => {
  const persona = String(req.body?.persona ?? "");
  const businessSlugOverride =
    typeof req.body?.businessSlug === "string" ? String(req.body.businessSlug).trim() : "";
  if (!persona) {
    sendError(res, req, 400, "persona is required");
    return;
  }

  let actorUserId: string | null = null;
  let actorEmail: string | null = null;
  try {
    const auth = getAuth(req);
    actorUserId = auth.userId ?? null;
    if (auth.userId) {
      const key = process.env.CLERK_SECRET_KEY;
      const clerk = key ? createClerkClient({ secretKey: key }) : null;
      if (clerk) {
        const u = await clerk.users.getUser(auth.userId);
        actorEmail = u.emailAddresses[0]?.emailAddress ?? null;
      }
    }
  } catch {
    // unsigned
  }

  if (process.env.NODE_ENV === "production") {
    try {
      assertDemoSignInAllowed(actorEmail);
    } catch {
      sendError(res, req, 404, "Not found");
      return;
    }
  }

  const requestId = (req as Request & { id?: string }).id;
  try {
    const out = await signInAsDemoPersona({
      personaId: persona,
      businessSlugOverride: businessSlugOverride || undefined,
      actorUserId,
      actorEmail,
    });
    logger.info(
      {
        event: "demo.sign_in.ok",
        request_id: requestId,
        persona,
        landing_path: out.landingPath,
        business_id: out.businessId ?? null,
      },
      "Demo persona sign-in",
    );
    res.json(out);
  } catch (e: unknown) {
    const err = e as Error & { status?: number; code?: string };
    logger.warn(
      {
        event: "demo.sign_in.failed",
        request_id: requestId,
        persona,
        status: err.status,
        code: err.code,
        message: err.message,
      },
      "Demo persona sign-in failed",
    );
    if (err.status === 404 || err.status === 409) {
      sendError(res, req, err.status, err.message);
      return;
    }
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, 500, err.message ?? "Sign-in failed");
  }
});

/** Optional: provision only when authenticated (founder setup). */
router.post("/demo/provision-authenticated", requireAuth, async (req, res): Promise<void> => {
  getUserId(req);
  try {
    res.json(await provisionDemoWorld());
  } catch (e: unknown) {
    const err = e as Error & { code?: string };
    if (err.code === "CLERK_NOT_CONFIGURED") {
      sendError(res, req, 503, err.message, { code: err.code });
      return;
    }
    sendError(res, req, 500, err.message ?? "Provision failed");
  }
});

export default router;
