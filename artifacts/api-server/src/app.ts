import express, { type Express, type ErrorRequestHandler, type RequestHandler, type Request } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import { getAuth, clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { Sentry } from "./lib/sentry";

const app: Express = express();

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
    return (auth?.sessionClaims?.userId as string | undefined) ?? auth?.userId ?? undefined;
  } catch {
    return undefined;
  }
}

app.use((req, res, next) => {
  const incoming = req.headers["x-request-id"];
  // Only honour client-supplied request ids that are strict UUIDs, to prevent log injection
  // and reflected-header attacks via the response. Otherwise generate one server-side.
  const id =
    typeof incoming === "string" && UUID_RE.test(incoming) ? incoming : randomUUID();
  (req as Request & { id?: string }).id = id;
  res.setHeader("x-request-id", id);
  next();
});

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as Request & { id?: string }).id ?? randomUUID(),
    customProps: (req, res) => ({
      request_id: (req as Request & { id?: string }).id,
      tenant_id: extractTenantId(req as Request),
      user_id: extractUserId(req as Request),
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

app.use(cors({ credentials: true, origin: true, exposedHeaders: ["x-request-id"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
};
app.use("/api", notFoundHandler);

// Sentry error reporting fires before the JSON error responder.
Sentry.setupExpressErrorHandler(app);

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err, path: req.path, method: req.method }, "Unhandled API error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

export default app;
