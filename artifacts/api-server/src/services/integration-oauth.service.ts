import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, tenantIntegrationConnectionsTable } from "@workspace/db";
import { generateId } from "../lib/id";

function oauthSecret(): string {
  return (
    process.env.INTEGRATION_OAUTH_STATE_SECRET ??
    process.env.CLERK_SECRET_KEY ??
    process.env.SESSION_SECRET ??
    "livia-oauth-dev-only"
  );
}

export type OAuthBrokerConfig = {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  extraAuthParams?: Record<string, string>;
};

export const OAUTH_BROKER_CONFIGS: Record<string, OAuthBrokerConfig> = {
  calendar_google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/calendar"],
    clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  },
  migration_acuity: {
    authUrl: "https://acuityscheduling.com/oauth2/authorize",
    tokenUrl: "https://acuityscheduling.com/oauth2/token",
    scopes: ["api-v1"],
    clientIdEnv: "ACUITY_CLIENT_ID",
    clientSecretEnv: "ACUITY_CLIENT_SECRET",
  },
  migration_square: {
    authUrl: "https://connect.squareup.com/oauth2/authorize",
    tokenUrl: "https://connect.squareup.com/oauth2/token",
    scopes: [
      "APPOINTMENTS_READ",
      "APPOINTMENTS_ALL_READ",
      "CUSTOMERS_READ",
      "ITEMS_READ",
      "EMPLOYEES_READ",
      "MERCHANT_PROFILE_READ",
    ],
    clientIdEnv: "SQUARE_APPLICATION_ID",
    clientSecretEnv: "SQUARE_APPLICATION_SECRET",
    extraAuthParams: { session: "false" },
  },
  migration_fresha: {
    authUrl: "https://partners.fresha.com/oauth/authorize",
    tokenUrl: "https://partners.fresha.com/oauth/token",
    scopes: ["partner.read"],
    clientIdEnv: "FRESHA_CLIENT_ID",
    clientSecretEnv: "FRESHA_CLIENT_SECRET",
  },
  messaging_whatsapp: {
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: ["whatsapp_business_management", "whatsapp_business_messaging"],
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
  },
};

export function signOAuthState(payload: { businessId: string; brokerId: string; ts: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", oauthSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState(state: string): { businessId: string; brokerId: string } | null {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", oauthSecret()).update(body).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      businessId?: string;
      brokerId?: string;
      ts?: number;
    };
    if (!parsed.businessId || !parsed.brokerId || !parsed.ts) return null;
    if (Date.now() - parsed.ts > 15 * 60_000) return null;
    return { businessId: parsed.businessId, brokerId: parsed.brokerId };
  } catch {
    return null;
  }
}

export function oauthRedirectUri(): string {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";
  return `${base}/api/import/oauth/callback`;
}

export function buildAuthorizeUrl(brokerId: string, businessId: string): string | null {
  const cfg = OAUTH_BROKER_CONFIGS[brokerId];
  if (!cfg) return null;
  const clientId = process.env[cfg.clientIdEnv];
  if (!clientId) return null;
  const state = signOAuthState({ businessId, brokerId, ts: Date.now() });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: oauthRedirectUri(),
    response_type: "code",
    scope: cfg.scopes.join(" "),
    state,
    ...(cfg.extraAuthParams ?? {}),
  });
  return `${cfg.authUrl}?${params.toString()}`;
}

export async function exchangeOAuthCode(
  brokerId: string,
  code: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date } | null> {
  const cfg = OAUTH_BROKER_CONFIGS[brokerId];
  if (!cfg) return null;
  const clientId = process.env[cfg.clientIdEnv];
  const clientSecret = process.env[cfg.clientSecretEnv];
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: oauthRedirectUri(),
    grant_type: "authorization_code",
  });

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) return null;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt:
      typeof json.expires_in === "number"
        ? new Date(Date.now() + json.expires_in * 1000)
        : undefined,
  };
}

export async function upsertTenantIntegrationConnection(args: {
  businessId: string;
  brokerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}) {
  const existing = await db
    .select({ id: tenantIntegrationConnectionsTable.id })
    .from(tenantIntegrationConnectionsTable)
    .where(
      and(
        eq(tenantIntegrationConnectionsTable.businessId, args.businessId),
        eq(tenantIntegrationConnectionsTable.brokerId, args.brokerId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(tenantIntegrationConnectionsTable)
      .set({
        accessToken: args.accessToken,
        refreshToken: args.refreshToken ?? null,
        expiresAt: args.expiresAt ?? null,
        metadata: args.metadata ?? {},
        updatedAt: new Date(),
      })
      .where(eq(tenantIntegrationConnectionsTable.id, existing[0].id));
    return existing[0].id;
  }

  const id = generateId();
  await db.insert(tenantIntegrationConnectionsTable).values({
    id,
    businessId: args.businessId,
    brokerId: args.brokerId,
    accessToken: args.accessToken,
    refreshToken: args.refreshToken ?? null,
    expiresAt: args.expiresAt ?? null,
    metadata: args.metadata ?? {},
  });
  return id;
}

export async function listTenantIntegrationConnections(businessId: string) {
  return db
    .select({
      brokerId: tenantIntegrationConnectionsTable.brokerId,
      connectedAt: tenantIntegrationConnectionsTable.connectedAt,
      expiresAt: tenantIntegrationConnectionsTable.expiresAt,
    })
    .from(tenantIntegrationConnectionsTable)
    .where(eq(tenantIntegrationConnectionsTable.businessId, businessId));
}

export async function tenantHasIntegrationConnection(
  businessId: string,
  brokerId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: tenantIntegrationConnectionsTable.id })
    .from(tenantIntegrationConnectionsTable)
    .where(
      and(
        eq(tenantIntegrationConnectionsTable.businessId, businessId),
        eq(tenantIntegrationConnectionsTable.brokerId, brokerId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

async function refreshOAuthAccessToken(
  brokerId: string,
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt?: Date } | null> {
  const cfg = OAUTH_BROKER_CONFIGS[brokerId];
  if (!cfg) return null;
  const clientId = process.env[cfg.clientIdEnv];
  const clientSecret = process.env[cfg.clientSecretEnv];
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  return {
    accessToken: json.access_token,
    expiresAt:
      typeof json.expires_in === "number"
        ? new Date(Date.now() + json.expires_in * 1000)
        : undefined,
  };
}

export async function getTenantAccessToken(
  businessId: string,
  brokerId: string,
): Promise<string | null> {
  const [row] = await db
    .select()
    .from(tenantIntegrationConnectionsTable)
    .where(
      and(
        eq(tenantIntegrationConnectionsTable.businessId, businessId),
        eq(tenantIntegrationConnectionsTable.brokerId, brokerId),
      ),
    )
    .limit(1);
  if (!row?.accessToken) return null;

  if (row.expiresAt && row.expiresAt.getTime() < Date.now() + 60_000 && row.refreshToken) {
    const refreshed = await refreshOAuthAccessToken(brokerId, row.refreshToken);
    if (refreshed) {
      await upsertTenantIntegrationConnection({
        businessId,
        brokerId,
        accessToken: refreshed.accessToken,
        refreshToken: row.refreshToken,
        expiresAt: refreshed.expiresAt,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
      });
      return refreshed.accessToken;
    }
  }
  return row.accessToken;
}
