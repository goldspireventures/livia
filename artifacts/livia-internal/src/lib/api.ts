const LS_KEY = "livia.internal.opsSecret";
const LS_OPERATOR_KEY = "livia.internal.opsOperator";
const LS_ROLE_KEY = "livia.internal.opsRole";

export const INTERNAL_OPS_ROLES = [
  // Highest privilege internal role (legacy: "founder")
  "exec",
  "engineer",
  "support_l2",
  "support_l1",
  "finance_read",
] as const;

export type InternalOpsRole = (typeof INTERNAL_OPS_ROLES)[number];

export function getOpsOperator(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(LS_OPERATOR_KEY) ?? "";
}

export function getOpsRole(): InternalOpsRole {
  if (typeof window === "undefined") return "engineer";
  const r = window.sessionStorage.getItem(LS_ROLE_KEY);
  const normalized = r === "founder" ? "exec" : r;
  return INTERNAL_OPS_ROLES.includes(normalized as InternalOpsRole)
    ? (normalized as InternalOpsRole)
    : "engineer";
}

export function setOpsIdentity(secret: string, operator: string, role: InternalOpsRole): void {
  setOpsSecret(secret);
  window.sessionStorage.setItem(LS_OPERATOR_KEY, operator.trim().toLowerCase());
  window.sessionStorage.setItem(LS_ROLE_KEY, role);
}

export function clearOpsIdentity(): void {
  clearOpsSecret();
  window.sessionStorage.removeItem(LS_OPERATOR_KEY);
  window.sessionStorage.removeItem(LS_ROLE_KEY);
}

export function getOpsSecret(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(LS_KEY) ?? "";
}

export function setOpsSecret(secret: string): void {
  window.sessionStorage.setItem(LS_KEY, secret);
}

export function clearOpsSecret(): void {
  window.sessionStorage.removeItem(LS_KEY);
}

export type InternalTenantListItem = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerEmail: string | null;
  planId: string | null;
  stripeSubscriptionStatus: string | null;
  createdAt: string;
  lastBookingAt: string | null;
};

export type InternalTenantDetail = InternalTenantListItem & {
  email: string | null;
  phone: string | null;
  timezone: string;
  tier: string;
  vertical: string;
  aiEnabled: boolean;
  voiceProvisioned: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  twilioPhoneNumber: string | null;
  activeStaffCount: number;
  bookingCount: number;
  lastInboundSmsAt: string | null;
  voiceReceptionistEntitled: boolean;
  deepLinks: {
    stripeCustomer: string | null;
    clerkUser: string | null;
    tenantDashboard: string | null;
    publicBooking: string | null;
    sentry: string | null;
  };
  supportDocLinks: Array<{ label: string; path: string }>;
};

export type SupportTicketTriage = {
  priority: "urgent" | "normal" | "low";
  tags: string[];
  suggestedReply: string;
};

export type InternalTicketNote = { at: string; by: string; body: string };

export type SupportTicketRow = {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  vertical: string | null;
  userId: string;
  reporterEmail: string | null;
  category: string;
  severity: string;
  description: string;
  status: string;
  assignedTo: string | null;
  internalNotes: InternalTicketNote[];
  triagedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  context?: Record<string, unknown> & { triage?: SupportTicketTriage };
  triage?: SupportTicketTriage;
};

export type LivIncidentBundle = {
  ticketId: string;
  category: string;
  conversationId: string | null;
  requestId: string | null;
  bookingId: string | null;
  conversation: {
    id: string;
    channel: string;
    status: string;
    summary: string | null;
    lastMessageAt: string;
  } | null;
  recentMessages: Array<{ role: string; content: string; createdAt: string; toolName: string | null }>;
  workflowEvents: Array<{ type: string; createdAt: string; level: string | null }>;
  continuityHints: Array<{ businessId: string; slug: string; stuckLabel: string | null }>;
  trace: {
    requestId: string;
    hint: string;
    sentrySearchUrl: string | null;
  } | null;
  suggestedActions: string[];
};

export type SupportTicketListFilters = {
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  businessId?: string;
  q?: string;
};

export type PlatformHealthV3 = {
  stuckContinuity: number;
  medspaTenants: number;
  deLocaleTenants: number;
  pendingMedspaConsents: number;
  activeWaitlist: number;
  petGroomTenants: number;
  migrations: string[];
};

export type PlatformHealth = {
  service: string;
  version: string;
  nodeEnv: string;
  tenantCount: number;
  inngestEnabled: boolean;
  stripeConfigured: boolean;
  clerkConfigured: boolean;
  timestamp: string;
  v3?: PlatformHealthV3;
};

export type FounderCockpitSnapshot = {
  platformHealth: PlatformHealth;
  observability: PlatformObservability;
  verticalCoverage: unknown;
  support: {
    openTotal: number;
    urgentOpen: number;
    oldestOpenHours: number | null;
    urgent: Array<{
      id: string;
      businessName: string;
      businessSlug: string;
      category: string;
      priority: "urgent" | "normal" | "low";
      createdAt: string;
      assignedTo: string | null;
    }>;
  };
  rollouts: {
    globalEnabled: Array<{ key: string; description: string | null }>;
    totalFlags: number;
  };
  gate: {
    founderGate: unknown | null;
    wargameReport: unknown | null;
  };
  commandCenter: {
    links: Array<{
      id: string;
      label: string;
      href: string;
      description?: string;
      kind: "customer" | "internal" | "external";
    }>;
    internalPortalBase: string;
  };
  production: {
    checkedAt: string;
    dashboardUrl: string;
    apiUrl: string;
    allRequiredOk: boolean;
    checks: Array<{ name: string; ok: boolean; detail: string; required: boolean }>;
  };
  release: {
    mode: string;
    betaSignupMode: string;
    demoEnabled: boolean;
    stagingRelaxations: {
      active: boolean;
      deployEnv: string;
      guestHub: { otpMode: string; phoneMode: string; magicOtpCode: string | null };
      controls: Record<string, string>;
    };
    steps: Array<{ id: string; label: string; done: boolean; hint?: string }>;
  };
  stagingPrep: {
    status: "not_provisioned" | "partial";
    note: string;
    checklist: readonly string[];
  };
  hats: Array<{
    id: string;
    role: string;
    mandate: string;
    status: "ok" | "watch" | "action";
    metrics: Array<{ label: string; value: string }>;
    actions: Array<{ label: string; internalPath?: string; href?: string }>;
    focus: string;
  }>;
  automations: Array<{
    id: string;
    label: string;
    description: string;
    role: string;
    destructive?: boolean;
  }>;
  workforceAccess: {
    goldspireDomain: string;
    grants: WorkforceAccessGrant[];
  };
};

export type WorkforceAccessGrant = {
  id: string;
  email: string;
  tier: "restricted" | "full";
  notes: string | null;
  grantedBy: string;
  grantedAt: string;
};

export type WorkforceAccessSelf = {
  email: string;
  tier: "none" | "restricted" | "full";
  goldspireRequiresCockpitGrant: boolean;
};

function internalHeaders(extra?: HeadersInit): HeadersInit {
  const secret = getOpsSecret();
  if (!secret) throw new Error("Set your internal ops secret first.");
  return {
    Accept: "application/json",
    "X-Internal-Ops-Secret": secret,
    "X-Internal-Ops-Operator": getOpsOperator() || "dev-operator@livia-hq.com",
    "X-Internal-Ops-Role": getOpsRole(),
    ...(extra ?? {}),
  };
}

function parseInternalJson(text: string, path: string, status: number): unknown {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    throw new Error(
      `API returned HTML instead of JSON for ${path}. Port 3000 is probably not Livia api-server — run pnpm start:platform:test (or stop the other app on :3000 and pnpm dev:api).`,
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`Invalid JSON from ${path} (HTTP ${status})`);
  }
}

/** Quick check that Vite proxy reaches Livia api-server. */
export async function pingInternalApi(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("/api/healthz", { headers: { Accept: "application/json" } });
    const text = await res.text();
    if (text.trim().startsWith("<")) {
      return {
        ok: false,
        message:
          "Port 3000 is not Livia API (got HTML). Stop other apps on :3000, then pnpm dev:api.",
      };
    }
    const data = JSON.parse(text) as { status?: string };
    if (res.ok && data.status === "ok") {
      return { ok: true, message: "Connected to Livia API" };
    }
    return { ok: false, message: `API health check failed (${res.status})` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Cannot reach API via /api proxy",
    };
  }
}

export async function getExecSnapshot(): Promise<FounderCockpitSnapshot> {
  return internalFetch<FounderCockpitSnapshot>("/internal/ops/exec/snapshot");
}

/** @deprecated */
export async function getOpsCockpit(): Promise<FounderCockpitSnapshot> {
  return getExecSnapshot();
}

export async function runExecAutomation(
  automationId: string,
  opts?: { confirm?: boolean },
): Promise<{ ok: boolean; summary: string; detail?: unknown }> {
  return internalFetch(`/internal/ops/exec/automations/${encodeURIComponent(automationId)}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirm: opts?.confirm === true }),
  });
}

export async function getWorkforceAccessSelf(): Promise<WorkforceAccessSelf> {
  return internalFetch<WorkforceAccessSelf>("/internal/ops/workforce-access/self");
}

export async function grantWorkforceAccess(args: {
  email: string;
  tier: "restricted" | "full";
  notes?: string;
}): Promise<{ ok: boolean }> {
  return internalFetch("/internal/ops/exec/workforce-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export async function revokeWorkforceAccess(email: string): Promise<{ ok: boolean }> {
  return internalFetch(`/internal/ops/exec/workforce-access/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
}

async function internalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: internalHeaders(init?.headers),
  });
  const text = await res.text();
  const data = parseInternalJson(text, path, res.status);
  if (!res.ok) {
    throw new Error(
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : res.status === 401
          ? "Unauthorized — INTERNAL_OPS_SECRET in this UI must match repo-root .env"
          : res.status === 404
            ? `Not found (${path}) — is the API on :3000 and INTERNAL_OPS_SECRET set?`
            : `Request failed (${res.status})`,
    );
  }
  return data as T;
}

export async function searchTenants(q: string) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  params.set("limit", "50");
  return internalFetch<{ data: InternalTenantListItem[]; total: number }>(
    `/internal/ops/tenants?${params}`,
  );
}

export async function getTenant(businessId: string) {
  return internalFetch<InternalTenantDetail>(`/internal/ops/tenants/${businessId}`);
}

export type InternalSupportBundle = {
  businessId: string;
  vertical: string;
  operatorPackSections: string[];
  suggestedReplySnippets: string[];
  recentAudit: Array<{ type: string; createdAt: string; entityType: string | null }>;
  openTickets: Array<{ id: string; category: string; severity: string; description: string }>;
  recentFeedback: Array<{ score: number; comment: string | null; createdAt: string }>;
  impersonationPolicy: string;
};

export async function getRequestTrace(requestId: string, businessId?: string) {
  const q = businessId ? `?businessId=${encodeURIComponent(businessId)}` : "";
  return internalFetch<{
    requestId: string;
    hint: string;
    sentrySearchUrl: string | null;
    tenantEvents: Array<{ type: string; createdAt: string; entityType: string | null }>;
    openTickets: Array<{ id: string; category: string; severity: string; createdAt: string }>;
  }>(`/internal/ops/trace/${encodeURIComponent(requestId)}${q}`);
}

export type SupportPointRow = {
  surfaceId: string;
  label: string;
  owner: string;
  apps: string[];
  routes: string[];
  policyModules: string[];
  services: string[];
  uiComponents: string[];
  tests: string[];
  runbook?: string;
  suggestedReply?: string;
};

export async function listSupportPoints() {
  return internalFetch<{ data: SupportPointRow[] }>("/internal/ops/support-points");
}

export async function getSupportBundle(businessId: string) {
  const res = await internalFetch<{
    businessId: string;
    impersonationPolicy: string;
    note: string;
    bundle: InternalSupportBundle;
  }>(`/internal/ops/tenants/${businessId}/support-context`);
  return res.bundle ?? res;
}

export async function listSupportTickets(filters: SupportTicketListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
  if (filters.businessId) params.set("businessId", filters.businessId);
  if (filters.q) params.set("q", filters.q);
  params.set("limit", "100");
  const qs = params.toString();
  return internalFetch<{ data: SupportTicketRow[]; total: number }>(
    `/internal/ops/support-tickets${qs ? `?${qs}` : ""}`,
  );
}

/** @deprecated Use listSupportTickets */
export async function listOpenSupportTickets() {
  return listSupportTickets({ status: "open,triaged" });
}

export async function getSupportTicket(ticketId: string) {
  return internalFetch<SupportTicketRow>(`/internal/ops/support-tickets/${ticketId}`);
}

export async function getLivIncidentBundle(ticketId: string) {
  return internalFetch<LivIncidentBundle>(
    `/internal/ops/support-tickets/${ticketId}/liv-incident`,
  );
}

export async function patchSupportTicket(
  ticketId: string,
  patch: {
    status?: SupportTicketRow["status"];
    assignedTo?: string | null;
    note?: string;
    reTriage?: boolean;
  },
) {
  return internalFetch<SupportTicketRow>(`/internal/ops/support-tickets/${ticketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function getPlatformHealth() {
  return internalFetch<PlatformHealth>("/internal/ops/platform-health");
}

export type PlatformObservability = PlatformHealth & {
  collectedInMs: number;
  database: { ok: boolean; latencyMs: number };
  traffic: {
    bookingsTotal: number;
    bookingsPending: number;
    bookingsToday: number;
    messagesLast24h: number;
    messagesFailed24h: number;
    conversationsOpen: number;
  };
  demo: { worldSlugs: number; tenantsProvisioned: number; ready: boolean };
  support: { ticketsOpen: number };
  compliance: { usersMissingPlatformLegal: number; legalGateSkipped: boolean };
  middleware: Record<string, boolean>;
  integrations: Record<string, boolean>;
  failsafes: Record<string, boolean | string>;
  alerts: Array<{ level: "warn" | "critical"; message: string }>;
  recentFailedMessages: Array<{ id: string; channel: string; at: string }>;
};

export type StressProbeResult = {
  probes: Array<{
    name: string;
    ok: boolean;
    status?: number;
    durationMs: number;
    detail?: string;
  }>;
  passed: number;
  failed: number;
};

export async function getObservability() {
  return internalFetch<PlatformObservability>("/internal/ops/observability");
}

export async function runStressProbes(apiBase?: string) {
  return internalFetch<StressProbeResult>("/internal/ops/stress-probes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiBase: apiBase ?? "" }),
  });
}

export async function backfillDemoLegal() {
  return internalFetch<{ updated: number; clerkCreated: number; accounts: number }>(
    "/internal/ops/demo/backfill-legal",
    { method: "POST" },
  );
}

export type DemoEnsureReadyResult = {
  provisioned: boolean;
  actions: string[];
  supportTicketsOpen: number;
  identities: { clerkCreated: number; legalUpdated: number; accounts: number };
};

export async function ensureDemoReady() {
  return internalFetch<DemoEnsureReadyResult>("/internal/ops/demo/ensure-ready", {
    method: "POST",
  });
}

export type MonitoringOverview = {
  observability: PlatformObservability;
  logBackends: {
    lokiPush: boolean;
    lokiQuery: boolean;
    openObserve: boolean;
    grafanaLocalUrl: string | null;
  };
  live: {
    refreshedAt: string;
    bookingsPerMinuteLastHour: number;
    eventsLast15m: number;
    failedNotificationsLast15m: number;
  };
  alerts: {
    openCount: number;
    newlyFired: number;
    openFirings: AlertFiringRow[];
  };
};

export type AlertRuleRow = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  severity: string;
  metricKey: string;
  operator: string;
  threshold: string;
  windowMinutes: number;
};

export type AlertFiringRow = {
  id: string;
  ruleId: string;
  firedAt: string;
  resolvedAt: string | null;
  valueAtFire: number;
  message: string;
  acknowledgedBy: string | null;
  ruleName?: string;
  severity?: string;
};

export type SavedLogSearchRow = {
  id: string;
  name: string;
  backend: string;
  queryJson: Record<string, unknown>;
  pinned: boolean;
};

export type GrafanaPanelRow = {
  id: string;
  title: string;
  panelType: string;
  embedPath: string;
  description: string | null;
  embedUrl: string | null;
};

export type MonitoringReport = {
  generatedAt: string;
  uptime: { api: string; database: string; logSink: string };
  metrics: Record<string, number>;
  alertEvaluation: { evaluated: number; newlyFired: number; openCount: number };
  openFirings: AlertFiringRow[];
  topErrorTypes: Array<{ type: string; count: number }>;
};

export type LogFieldContract = {
  stream: string;
  recommendedIndexFields: string[];
  logqlExamples: string[];
  openObserveSqlExamples: string[];
};

export type MonitoringTimeSeries = {
  hours: number;
  bookings: Array<{ hour: string; count: number }>;
  eventsByLevel: Array<{ hour: string; INFO: number; WARN: number; ERROR: number }>;
  notifications: Array<{ hour: string; sent: number; failed: number }>;
};

export type PlatformLogEntry = {
  id: string;
  source: "event" | "notification" | "message";
  timestamp: string;
  level: string;
  type: string;
  businessId: string | null;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  context: Record<string, unknown> | null;
};

export type DataFlowNode = {
  id: string;
  label: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  detail: string;
  lastActivityAt: string | null;
  count24h: number;
};

export type OpsOnboardingChecklist = {
  ready: boolean;
  score: number;
  checks: Array<{
    id: string;
    label: string;
    status: "pass" | "warn" | "fail" | "manual";
    detail: string;
    action?: string;
  }>;
};

export type ExternalLogResult = {
  backend: "loki" | "openobserve" | "none";
  configured: boolean;
  lines: Array<{ timestamp: string; line: string; labels?: Record<string, string> }>;
  error?: string;
  queryHint?: string;
};

export async function getMonitoringOverview() {
  return internalFetch<MonitoringOverview>("/internal/ops/monitoring/overview");
}

export async function getMonitoringSeries(hours = 24) {
  return internalFetch<MonitoringTimeSeries>(
    `/internal/ops/monitoring/series?hours=${encodeURIComponent(String(hours))}`,
  );
}

export async function getMonitoringLogs(filters: {
  q?: string;
  level?: string;
  source?: string;
  businessId?: string;
  requestId?: string;
  hours?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.level) params.set("level", filters.level);
  if (filters.source) params.set("source", filters.source);
  if (filters.businessId) params.set("businessId", filters.businessId);
  if (filters.requestId) params.set("requestId", filters.requestId);
  if (filters.hours) params.set("hours", String(filters.hours));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return internalFetch<{ entries: PlatformLogEntry[]; total: number }>(
    `/internal/ops/monitoring/logs${qs ? `?${qs}` : ""}`,
  );
}

export async function getMonitoringLoki(filters: {
  q?: string;
  sql?: string;
  tenantId?: string;
  requestId?: string;
  level?: string;
  hours?: number;
  backend?: "loki" | "openobserve" | "auto";
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.sql) params.set("sql", filters.sql);
  if (filters.tenantId) params.set("tenantId", filters.tenantId);
  if (filters.requestId) params.set("requestId", filters.requestId);
  if (filters.level) params.set("level", filters.level);
  if (filters.hours) params.set("hours", String(filters.hours));
  if (filters.backend) params.set("backend", filters.backend);
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return internalFetch<ExternalLogResult>(`/internal/ops/monitoring/loki${qs ? `?${qs}` : ""}`);
}

export async function getMonitoringFlows() {
  return internalFetch<{ flows: DataFlowNode[]; refreshedAt: string }>(
    "/internal/ops/monitoring/flows",
  );
}

export async function getMonitoringOnboarding() {
  return internalFetch<OpsOnboardingChecklist>("/internal/ops/monitoring/onboarding");
}

export async function getMonitoringReport() {
  return internalFetch<MonitoringReport>("/internal/ops/monitoring/report");
}

export async function getMonitoringLogFields() {
  return internalFetch<LogFieldContract>("/internal/ops/monitoring/log-fields");
}

export async function listAlertRules() {
  return internalFetch<{ data: AlertRuleRow[] }>("/internal/ops/monitoring/alerts/rules");
}

export async function listAlertFirings(openOnly = false) {
  return internalFetch<{ data: AlertFiringRow[] }>(
    `/internal/ops/monitoring/alerts/firings?openOnly=${openOnly}`,
  );
}

export async function evaluateAlerts() {
  return internalFetch<{ evaluated: number; newlyFired: number; openCount: number }>(
    "/internal/ops/monitoring/alerts/evaluate",
    { method: "POST" },
  );
}

export async function acknowledgeAlertFiring(firingId: string) {
  return internalFetch<{ ok: boolean }>(
    `/internal/ops/monitoring/alerts/firings/${firingId}/acknowledge`,
    { method: "POST" },
  );
}

export async function resolveAlertFiring(firingId: string) {
  return internalFetch<{ ok: boolean }>(
    `/internal/ops/monitoring/alerts/firings/${firingId}/resolve`,
    { method: "POST" },
  );
}

export async function patchAlertRule(
  ruleId: string,
  patch: Partial<{ enabled: boolean; threshold: number }>,
) {
  return internalFetch<AlertRuleRow>(`/internal/ops/monitoring/alerts/rules/${ruleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function listSavedLogSearches() {
  return internalFetch<{ data: SavedLogSearchRow[] }>("/internal/ops/monitoring/saved-searches");
}

export async function createSavedLogSearch(input: {
  name: string;
  backend: "platform" | "loki" | "openobserve";
  queryJson: Record<string, unknown>;
  pinned?: boolean;
}) {
  return internalFetch<SavedLogSearchRow>("/internal/ops/monitoring/saved-searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteSavedLogSearch(id: string) {
  await internalFetch<void>(`/internal/ops/monitoring/saved-searches/${id}`, { method: "DELETE" });
}

export async function listGrafanaPanels() {
  return internalFetch<{ panels: GrafanaPanelRow[] }>("/internal/ops/monitoring/grafana");
}

export type CompanyDocEntry = {
  path: string;
  title: string;
  category: string;
  isCanonical: boolean;
};

export async function fetchCompanyDocsIndex(): Promise<{
  canonical: CompanyDocEntry[];
  byCategory: Record<string, CompanyDocEntry[]>;
}> {
  return internalFetch("/internal/ops/docs/index");
}

export async function fetchCompanyDoc(path: string): Promise<{ path: string; content: string }> {
  return internalFetch(`/internal/ops/docs/file?path=${encodeURIComponent(path)}`);
}

export async function fetchVerticalCoverage(): Promise<{
  data: Array<{
    docId: string;
    label: string;
    tier: string;
    codeVertical: string | null;
    demoSlug: string | null;
  }>;
}> {
  return internalFetch("/internal/ops/vertical-coverage");
}

export async function internalLivAssist(args: {
  message: string;
  focusBusinessId?: string;
}): Promise<{ reply: string; suggestions?: string[] }> {
  const secret = getOpsSecret();
  if (!secret) throw new Error("Set your internal ops secret first.");
  const res = await fetch("/api/internal/ops/liv/assist", {
    method: "POST",
    headers: {
      ...internalHeaders({ "Content-Type": "application/json" }),
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new Error(
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : res.status === 404
          ? "Not found — is the API on :3000 and INTERNAL_OPS_SECRET set?"
          : `Request failed (${res.status})`,
    );
  }
  return data as { reply: string; suggestions?: string[] };
}
