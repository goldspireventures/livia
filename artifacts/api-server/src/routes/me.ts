import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, staffTable, businessMembershipsTable, businessesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireAuth, getUserId, resolveMembership, getStaffIdForUser } from "../lib/auth";
import { getOrCreateUser, getUserById, updateUser } from "../services/users.service";
import { getDemoPersonaByEmail, isDemoEmail } from "../lib/demo-portal-config";
import { DEMO_SCENARIO_ACCOUNTS } from "../lib/demo-scenario-config";
import {
  buildPlatformLegalAcceptance,
  hasCurrentPlatformLegal,
  isLegalGateSkipped,
  PLATFORM_PRIVACY_VERSION,
  PLATFORM_TOS_VERSION,
} from "../lib/platform-legal-gate";
import { getBetaSignupMode } from "../lib/beta-signup-gate";
import { getBusinessesForUser } from "../services/businesses.service";
import { getChainRollupForOwner, getOrgShapeSignalsForOwner } from "../services/chain-rollup.service";
import { resolveOrgShapeProfile } from "@workspace/policy";
import { getBrandPortfolioForOwner } from "../services/brand-portfolio.service";
import { getFranchiseRollupForOwner } from "../services/franchise-rollup.service";
import { registerDeviceToken } from "../services/device-tokens.service";
import { getVapidPublicKey, isWebPushConfigured } from "../services/web-push.service";
import { inngest, isInngestWorkflowsEnabled } from "../lib/inngest";
import { getLivPresenceForOrgAdmin } from "../services/liv-presence.service";
import {
  getInAppUnreadCount,
  listInAppNotificationsForUser,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
} from "../services/in-app-notifications.service";
import { getTenantExperienceForBusiness } from "../services/tenant-experience.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();

const RECEPTION_HINT = /(reception|front[ -]?desk|concierge)/i;

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  let user = await getOrCreateUser(userId);
  if (
    process.env.NODE_ENV !== "production" &&
    isDemoEmail(user.email) &&
    !hasCurrentPlatformLegal(user.platformLegal)
  ) {
    await updateUser(userId, { platformLegal: buildPlatformLegalAcceptance("demo-backfill") });
    user = (await getUserById(userId)) ?? user;
  }
  res.json({
    ...user,
    platformLegalCurrent: {
      tosVersion: PLATFORM_TOS_VERSION,
      privacyVersion: PLATFORM_PRIVACY_VERSION,
    },
    platformLegalAccepted: isLegalGateSkipped() || hasCurrentPlatformLegal(user.platformLegal),
    betaSignupMode: getBetaSignupMode(),
  });
});

router.post("/me/platform-legal", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { accept } = req.body as { accept?: boolean };
  if (accept !== true) {
    sendError(res, req, 400, "accept: true is required");
    return;
  }
  const auth = getAuth(req);
  const sessionId = auth.sessionId ?? undefined;
  const email =
    auth.sessionClaims?.email as string | undefined ??
    (auth as { sessionClaims?: { primary_email_address?: string } }).sessionClaims
      ?.primary_email_address;
  const fullName =
    [auth.sessionClaims?.first_name, auth.sessionClaims?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined;
  await getOrCreateUser(userId, email, fullName);
  const platformLegal = buildPlatformLegalAcceptance(sessionId);
  const updated = await updateUser(userId, { platformLegal });
  if (!updated) {
    sendError(res, req, 404, "User not found");
    return;
  }
  res.json({
    ...updated,
    platformLegalAccepted: true,
  });
});

router.patch("/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { fullName, avatarUrl } = req.body;
  const updated = await updateUser(userId, { fullName, avatarUrl });
  if (!updated) {
    sendError(res, req, 404, "User not found");
    return;
  }
  res.json(updated);
});

router.get("/me/tenant-experience", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId =
    typeof req.query.businessId === "string" ? req.query.businessId : undefined;
  if (!businessId) {
    sendError(res, req, 400, "businessId query is required");
    return;
  }
  const role = await resolveMembership(userId, businessId);
  if (!role) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  const experience = await getTenantExperienceForBusiness(businessId);
  if (!experience) {
    sendError(res, req, 404, "Business not found");
    return;
  }
  res.json(experience);
});

router.get("/me/businesses", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  let businesses = await getBusinessesForUser(userId);
  const user = await getUserById(userId);
  if (user?.email && isDemoEmail(user.email)) {
    const def =
      getDemoPersonaByEmail(user.email) ??
      DEMO_SCENARIO_ACCOUNTS.find((p) => p.email.toLowerCase() === user.email!.toLowerCase());
    if (def?.businessSlugs?.length) {
      const allowed = new Set(def.businessSlugs);
      businesses = businesses.filter((b) => b.slug && allowed.has(b.slug));
    }
  }
  res.json(businesses);
});

/** All workplaces for this Clerk user (multi-location staff + founders). */
router.get("/me/workplaces", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const rows = await db
    .select({
      membershipId: businessMembershipsTable.id,
      businessId: businessMembershipsTable.businessId,
      role: businessMembershipsTable.role,
      roleV2: businessMembershipsTable.roleV2,
      scope: businessMembershipsTable.scope,
      businessName: businessesTable.name,
      businessSlug: businessesTable.slug,
      city: businessesTable.city,
      vertical: businessesTable.vertical,
      tier: businessesTable.tier,
    })
    .from(businessMembershipsTable)
    .innerJoin(businessesTable, eq(businessMembershipsTable.businessId, businessesTable.id))
    .where(eq(businessMembershipsTable.userId, userId));

  res.json({
    workplaces: rows.map((r) => ({
      membershipId: r.membershipId,
      businessId: r.businessId,
      name: r.businessName,
      slug: r.businessSlug,
      city: r.city,
      vertical: r.vertical,
      tier: r.tier,
      role: r.role,
      roleV2: r.roleV2,
      scope: r.scope,
    })),
  });
});

/** Multi-shop rollup for owners (RFC 0010). */
router.get("/me/chain-rollup", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  res.json(await getChainRollupForOwner(userId));
});

router.get("/me/chain-rollup/export.csv", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { getChainRollupForOwner, chainRollupToCsv } = await import(
    "../services/chain-rollup.service"
  );
  const rollup = await getChainRollupForOwner(userId);
  const csv = chainRollupToCsv(rollup);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="livia-chain-${new Date().toISOString().slice(0, 10)}.csv"`,
  );
  res.send(csv);
});

/** Org-admin / multi-location Liv ritual line (portfolio scope). */
router.get("/me/liv-presence", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  res.json(await getLivPresenceForOrgAdmin(userId));
});

/** Detected org configuration (C2–C13) for persona routing and lifecycle. */
router.get("/me/org-shape", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const signals = await getOrgShapeSignalsForOwner(userId);
  res.json({ signals, profile: resolveOrgShapeProfile(signals) });
});

/** Multi-brand portfolio (C13) — brand shells + location businesses. */
router.get("/me/brand-portfolio", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  res.json(await getBrandPortfolioForOwner(userId));
});

/** Franchise rollup (C11) — aggregates only, no customer PII. */
router.get("/me/franchise-rollup", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  res.json(await getFranchiseRollupForOwner(userId));
});

/** Cross-shop staff borrow (C7) — emits Inngest event for approval scaffold. */
router.post("/me/staff-borrow-request", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { hostBusinessId, staffId, targetBusinessId, from, to } = req.body ?? {};
  if (!hostBusinessId || !staffId || !targetBusinessId || !from || !to) {
    sendError(res, req, 400, "hostBusinessId, staffId, targetBusinessId, from, to required");
    return;
  }
  const role = await resolveMembership(userId, hostBusinessId);
  if (!role || role === "STAFF") {
    sendError(res, req, 403, "Owner or admin required on host shop");
    return;
  }
  if (!isInngestWorkflowsEnabled()) {
    sendError(res, req, 503, "Workflows disabled");
    return;
  }
  await inngest.send({
    name: "livia/staff-borrow.requested",
    data: { hostBusinessId, staffId, targetBusinessId, from, to },
  });
  res.status(202).json({ ok: true });
});

// Per ADR 0010 — persona is derived, never stored. We surface the
// minimum signal needed for the client to derive the right shell:
// role, ownStaffId, plus two cheap signals about that staff record
// (front-desk title hint, tenure in days). The client combines these
// with businessCount to pick founder/owner/manager/receptionist/
// senior/junior/customer. Returns 404 when there's no membership at
// all (cross-tenant isolation).
router.get(
  "/me/businesses/:businessId/membership",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const businessId = Array.isArray(req.params.businessId)
      ? req.params.businessId[0]
      : req.params.businessId;
    const role = await resolveMembership(userId, businessId);
    if (!role) {
      sendError(res, req, 404, "Business not found");
      return;
    }
    const staffId = await getStaffIdForUser(userId, businessId);

    const [memRow] = await db
      .select({ scope: businessMembershipsTable.scope })
      .from(businessMembershipsTable)
      .where(
        and(
          eq(businessMembershipsTable.businessId, businessId),
          eq(businessMembershipsTable.userId, userId),
        ),
      );

    const deskRole = (memRow?.scope as { deskRole?: string } | null)?.deskRole;
    let isReception = deskRole === "reception";
    let tenureDays = 0;
    if (staffId) {
      const [s] = await db
        .select({
          displayName: staffTable.displayName,
          firstName: staffTable.firstName,
          lastName: staffTable.lastName,
          bio: staffTable.bio,
          createdAt: staffTable.createdAt,
        })
        .from(staffTable)
        .where(and(eq(staffTable.id, staffId), eq(staffTable.businessId, businessId)));
      if (s) {
        const haystack = `${s.displayName ?? ""} ${s.firstName ?? ""} ${s.lastName ?? ""} ${s.bio ?? ""}`;
        if (!isReception) {
          isReception = RECEPTION_HINT.test(haystack);
        }
        const ms = Date.now() - new Date(s.createdAt).getTime();
        tenureDays = Math.max(0, Math.floor(ms / 86_400_000));
      }
    }

    res.json({ businessId, role, staffId, isReception, tenureDays });
  },
);

router.get("/me/notifications", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = typeof req.query.businessId === "string" ? req.query.businessId : undefined;
  const unreadOnly = req.query.unreadOnly === "true";
  const limit = Number(req.query.limit ?? 40);

  const rows = await listInAppNotificationsForUser(userId, {
    businessId,
    limit: Number.isFinite(limit) ? limit : 40,
    unreadOnly,
  });

  const unreadCount = await getInAppUnreadCount(userId, businessId);

  res.json({
    data: rows.map((r) => ({
      id: r.id,
      businessId: r.businessId,
      kind: r.kind,
      priority: r.priority,
      personaHint: r.personaHint,
      title: r.title,
      body: r.body,
      href: r.href,
      mobileHref: r.mobileHref,
      resourceKind: r.resourceKind,
      resourceId: r.resourceId,
      readAt: r.readAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    unreadCount,
  });
});

router.get("/me/notifications/unread-count", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId = typeof req.query.businessId === "string" ? req.query.businessId : undefined;
  const count = await getInAppUnreadCount(userId, businessId);
  res.json({ count });
});

router.post("/me/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const businessId =
    typeof req.body?.businessId === "string" ? req.body.businessId : undefined;
  const updated = await markAllInAppNotificationsRead(userId, businessId);
  res.json({ updated });
});

router.patch("/me/notifications/:notificationId/read", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const notificationId = String(req.params.notificationId ?? "");
  if (!notificationId) {
    sendError(res, req, 400, "notificationId is required");
    return;
  }
  const ok = await markInAppNotificationRead(userId, notificationId);
  if (!ok) {
    sendError(res, req, 404, "Notification not found");
    return;
  }
  res.json({ ok: true });
});

router.get("/me/push-config", requireAuth, async (_req, res): Promise<void> => {
  res.json({
    vapidPublicKey: getVapidPublicKey(),
    webPushEnabled: isWebPushConfigured(),
  });
});

router.post("/me/device-tokens", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { token, platform } = req.body ?? {};
  if (!token || typeof token !== "string") {
    sendError(res, req, 400, "token is required");
    return;
  }
  const plat = platform === "ANDROID" || platform === "WEB" ? platform : "IOS";
  const row = await registerDeviceToken({ userId, token: token.trim(), platform: plat });
  res.json({
    id: row.id,
    platform: row.platform,
    token: row.token,
    isActive: row.isActive,
  });
});

export default router;
