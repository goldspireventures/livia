// Server-side invitation flow.
//
// Strategy (v1, deliberately simple):
// 1. Owner/admin POSTs to /businesses/:bid/invitations with
//    { email, role }. We call Clerk's createInvitation API and stash
//    `{ businessId, role, businessName }` in publicMetadata.
// 2. Invited user clicks the email link, signs up via Clerk's hosted
//    flow. On their first authenticated request the dashboard calls
//    POST /me/accept-invitations, which reads pending memberships from
//    Clerk's user.publicMetadata and inserts the corresponding
//    business_memberships row(s).
// 3. We avoid a webhook + a separate "pending invitations" table on
//    purpose for v1 — Clerk is already the source of truth for invite
//    state and adding our own table doubles the failure modes.
//
// If CLERK_SECRET_KEY is unset (e.g. local dev pointed at a public
// Clerk key only), we fail fast with 503 so the UI can show a clean
// "invitations need server config" empty state.

import { createClerkClient } from "@clerk/express";
import {
  db,
  businessMembershipsTable,
  businessesTable,
  usersTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { generateId } from "../lib/id";
import { logger } from "../lib/logger";
import { cachedClerkGetUser, noteClerkRateLimit } from "../lib/clerk-user-cache";

export type InvitableRole = "ADMIN" | "STAFF";
export type DeskRole = "manager" | "reception";

function getClerk() {
  const secretKey = process.env["CLERK_SECRET_KEY"];
  if (!secretKey) return null;
  return createClerkClient({ secretKey });
}

export async function createInvitation(opts: {
  businessId: string;
  businessName: string;
  email: string;
  role: InvitableRole;
  deskRole?: DeskRole;
  inviterUserId: string;
  redirectUrl?: string;
  /** G8 — invited from Settings → Ownership (not Team page). */
  successionIntent?: boolean;
}) {
  const clerk = getClerk();
  if (!clerk) {
    const err: Error & { code?: string } = new Error(
      "Clerk server SDK is not configured (set CLERK_SECRET_KEY).",
    );
    err.code = "CLERK_NOT_CONFIGURED";
    throw err;
  }

  // Stash everything the accept-step needs. We deliberately do NOT
  // create a pending DB row — Clerk is the SoT for invitation state.
  const invitation = await clerk.invitations.createInvitation({
    emailAddress: opts.email,
    redirectUrl: opts.redirectUrl,
    publicMetadata: {
      livia: {
        businessId: opts.businessId,
        businessName: opts.businessName,
        role: opts.role,
        deskRole: opts.deskRole ?? (opts.role === "ADMIN" ? "manager" : undefined),
        invitedBy: opts.inviterUserId,
        successionIntent: opts.successionIntent === true,
      },
    },
    notify: true,
    ignoreExisting: false,
  });

  logger.info(
    {
      businessId: opts.businessId,
      email: opts.email,
      role: opts.role,
      invitationId: invitation.id,
    },
    "Created Clerk invitation",
  );

  return {
    id: invitation.id,
    emailAddress: invitation.emailAddress,
    status: invitation.status,
    createdAt: invitation.createdAt,
  };
}

/**
 * Called from /me/accept-invitations on the first authenticated request
 * after signup. Pulls the user's publicMetadata.livia from Clerk; for
 * each pending business it creates the membership row (idempotent).
 *
 * Returns the list of businesses the user was just added to so the UI
 * can route them to the right place.
 */
export async function acceptPendingInvitations(userId: string) {
  const clerk = getClerk();
  if (!clerk) return { accepted: [] };

  let user;
  try {
    user = await cachedClerkGetUser(userId, () => clerk.users.getUser(userId));
  } catch (err) {
    if ((err as { status?: number } | null)?.status === 429) {
      noteClerkRateLimit((err as { retryAfter?: number }).retryAfter ?? 10);
    }
    logger.warn({ err, userId }, "Could not fetch Clerk user for invitation accept");
    return { accepted: [] };
  }

  const meta = (user.publicMetadata as Record<string, unknown> | undefined) ?? {};
  const livia = meta["livia"] as
    | { businessId?: string; role?: InvitableRole; deskRole?: DeskRole }
    | undefined;
  if (!livia?.businessId || !livia?.role) {
    return { accepted: [] };
  }

  // Confirm the business still exists.
  const [biz] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, livia.businessId));
  if (!biz) return { accepted: [] };

  // Make sure the user row exists locally (id = clerk userId).
  await db
    .insert(usersTable)
    .values({
      id: userId,
      email:
        user.emailAddresses?.[0]?.emailAddress ?? `${userId}@unknown.livia`,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    })
    .onConflictDoNothing();

  // Idempotent membership upsert.
  const [existing] = await db
    .select()
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, biz.id),
        eq(businessMembershipsTable.userId, userId),
      ),
    );
  const scope =
    livia.deskRole === "reception" || livia.deskRole === "manager"
      ? { deskRole: livia.deskRole }
      : livia.role === "ADMIN"
        ? { deskRole: "manager" as const }
        : undefined;

  if (!existing) {
    await db.insert(businessMembershipsTable).values({
      id: generateId(),
      businessId: biz.id,
      userId,
      role: livia.role,
      scope: scope ?? null,
    });
  } else if (scope && !existing.scope) {
    await db
      .update(businessMembershipsTable)
      .set({ scope, updatedAt: new Date() })
      .where(eq(businessMembershipsTable.id, existing.id));
  }

  // Clear the invitation marker so we don't re-process it. Best-effort —
  // the membership write is the source of truth.
  try {
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { livia: null },
    });
  } catch (err) {
    logger.warn({ err, userId }, "Failed to clear publicMetadata.livia");
  }

  return {
    accepted: [
      {
        businessId: biz.id,
        businessName: biz.name,
        role: (existing?.role ?? livia.role) as InvitableRole,
        deskRole:
          (scope as { deskRole?: DeskRole } | undefined)?.deskRole ??
          (livia.deskRole === "reception" || livia.deskRole === "manager"
            ? livia.deskRole
            : null),
        vertical: biz.vertical ?? null,
      },
    ],
  };
}
