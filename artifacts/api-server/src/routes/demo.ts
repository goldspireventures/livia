import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { requireAuth, getUserId } from "../lib/auth";
import { logger } from "../lib/logger";
import { isDemoPortalEnabled } from "../lib/demo-portal-config";
import {
  assertDemoSignInAllowed,
  getDemoCatalog,
  getDemoPortalStatus,
  provisionDemoWorld,
  syncDemoWorld,
  signInAsDemoBusiness,
  signInAsDemoEmail,
  signInAsDemoPersona,
  syncAllDemoClerkUsers,
  syncVerticalShowcaseForDemo,
  quickDemoSignIn,
} from "../services/demo-portal.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();

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
    const err = e as Error & { code?: string; status?: number };
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
    sendError(res, req, 500, err.message ?? "Provision failed");
  }
});

/** Fast sync — refresh Clerk + rosters without wiping businesses (~5–15s). */
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
        clerk_synced: result.clerkSynced,
        roster_accounts: result.rosterAccounts,
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
