import express, { type Express, type ErrorRequestHandler, type RequestHandler, type Request } from "express";
import uploadsRouter from "./routes/uploads";
import { resolveUploadDir } from "./lib/upload-store";
import compression from "compression";
import billingWebhooksRouter from "./routes/billing-webhooks";
import metaWebhookRouter from "./routes/meta-webhook";
import cors from "cors";
import { corsOrigin } from "./lib/cors-config";
import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import { getAuth, clerkMiddleware } from "@clerk/express";
import { simAuthMiddleware } from "./lib/sim-auth";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import inngestServe from "./routes/inngest-serve";
import { logger } from "./lib/logger";
import { Sentry } from "./lib/sentry";

const app: Express = express();

if (process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Strict UUID v1-v5 (and nil) — used to validate any externally-supplied id we plan to log.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Match `/api/businesses/<uuid>/...` (also without /api prefix) to extract tenant id for logs.
const TENANT_PATH_RE = /\/businesses\/([0-9a-fA-F-]{36})(?:\/|$|\?)/;

function extractTenantId(req: Request): string | undefined {
  const fromUrl = req.url?.match(TENANT_PATH_RE)?.[1];
  if (fromUrl && UUID_RE.test(fromUrl)) return fromUrl;
  const fromHeader = req.headers["x-business-id"];
  if (typeof fromHeader === "string" && UUID_RE.test(fromHeader)) return fromHeader;
  return undefined;
}

function extractUserId(req: Request): string | undefined {
  try {
    const auth = getAuth(req);
    return auth.userId ?? undefined;
  } catch {
    return undefined;
  }
}

function extractPlanTier(req: Request): string | undefined {
  return req.resolvedTenant?.planTier;
}

app.use((req, res, next) => {
  const incoming = req.headers["x-request-id"];
  const id =
    typeof incoming === "string" && UUID_RE.test(incoming) ? incoming : randomUUID();
  (req as Request & { id?: string }).id = id;
  res.setHeader("x-request-id", id);
  Sentry.setTag("request_id", id);
  const tidEarly = extractTenantId(req as Request) ?? req.resolvedTenant?.businessId;
  if (tidEarly) Sentry.setTag("tenant_id", tidEarly);
  res.on("finish", () => {
    const tid = extractTenantId(req as Request) ?? req.resolvedTenant?.businessId;
    if (tid) Sentry.setTag("tenant_id", tid);
  });
  next();
});

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as Request & { id?: string }).id ?? randomUUID(),
    customProps: (req, res) => ({
      request_id: (req as Request & { id?: string }).id,
      tenant_id: extractTenantId(req as Request) ?? req.resolvedTenant?.businessId,
      user_id: extractUserId(req as Request),
      plan_tier: extractPlanTier(req as Request),
      method: req.method,
      path: (req.url ?? "").split("?")[0],
      status: res.statusCode,
    }),
    customAttributeKeys: { responseTime: "duration_ms" },
    // Drop the verbose default `req`/`res` blobs — top-level fields above are the contract.
    serializers: {
      req: () => undefined as unknown as object,
      res: () => undefined as unknown as object,
    },
    customSuccessMessage: (req, res, responseTime) =>
      `${req.method} ${(req.url ?? "").split("?")[0]} ${res.statusCode} ${Math.round(responseTime)}ms`,
    customErrorMessage: (req, res, _err) =>
      `${req.method} ${(req.url ?? "").split("?")[0]} ${res.statusCode} ERR`,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(
  cors({
    credentials: true,
    origin: corsOrigin,
    exposedHeaders: ["x-request-id"],
  }),
);

const compressResponses =
  process.env.NODE_ENV === "production" || process.env.API_COMPRESS === "true";
if (compressResponses) {
  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compress"] === "1") return false;
        return compression.filter(req, res);
      },
    }),
  );
}

// Stripe webhooks need the raw body for signature verification.
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  billingWebhooksRouter,
);

app.use("/api", metaWebhookRouter);

app.use(
  "/uploads",
  express.static(resolveUploadDir(), {
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
    fallthrough: false,
  }),
);

/** Multipart + base64 uploads (base64 route carries its own json parser). */
app.use("/api", uploadsRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev-only simulation auth bypass — must run before Clerk so simulated userId lands first.
app.use(simAuthMiddleware);

// Prefer CLERK_PUBLISHABLE_KEY from env (required for device testing on LAN IP).
// publishableKeyFromHost() synthesizes a per-host key; mobile JWTs are signed with
// your real pk_test_* key and will 401 if the API verifies with the wrong key.
app.use(
  clerkMiddleware((req) => {
    const fromEnv =
      process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
    const publishableKey =
      fromEnv ||
      publishableKeyFromHost(getClerkProxyHost(req) ?? "", undefined);
    return { publishableKey };
  }),
);

app.use("/api/inngest", inngestServe);
app.use("/api", router);

const notFoundHandler: RequestHandler = (req, res) => {
  const requestId = (req as Request & { id?: string }).id;
  res.status(404).json({ error: "Not found", path: req.path, requestId: requestId ?? undefined });
};
app.use("/api", notFoundHandler);

// Sentry error reporting fires before the JSON error responder.
Sentry.setupExpressErrorHandler(app);

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = (req as Request & { id?: string }).id;
  const tenantId = extractTenantId(req) ?? req.resolvedTenant?.businessId;
  logger.error(
    {
      err,
      request_id: requestId,
      tenant_id: tenantId,
      user_id: extractUserId(req),
      method: req.method,
      path: (req.url ?? "").split("?")[0],
    },
    "Unhandled API error",
  );
  if (res.headersSent) return;
  res.status(500).json({
    error: "Internal server error",
    requestId: requestId ?? undefined,
  });
};
app.use(errorHandler);

export default app;
