import { getBetaSignupMode } from "../lib/beta-signup-gate.js";
import { isDemoPortalEnabled } from "../lib/demo-portal-config.js";
import { getStagingRelaxations } from "../lib/staging-relaxations.js";
import {
  getApiPublicUrl,
  getDashboardUrl,
  getInternalUrl,
  getMarketingUrl,
} from "../lib/public-urls.js";

export type FounderProdCheck = {
  name: string;
  ok: boolean;
  detail: string;
  required: boolean;
};

async function probe(
  url: string,
  validate?: (res: Response, text: string) => string | null,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12_000) });
    const text = await res.text();
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    const err = validate?.(res, text);
    if (err) return { ok: false, detail: err };
    return { ok: true, detail: "OK" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, detail: msg.slice(0, 120) };
  }
}

/** Live production probes — same intent as `pnpm prod:smoke`, runnable from the cockpit API. */
export async function runFounderProductionChecks(): Promise<{
  checkedAt: string;
  dashboardUrl: string;
  apiUrl: string;
  allRequiredOk: boolean;
  checks: FounderProdCheck[];
}> {
  const dashboardUrl = getDashboardUrl();
  const apiUrl = getApiPublicUrl();
  const clerkHost = dashboardUrl.replace(/^https?:\/\/app\./, "https://clerk.");

  const checks: FounderProdCheck[] = [];

  const apiHealth = await probe(`${apiUrl}/api/healthz`, (_res, text) =>
    text.includes('"ok"') || text.includes('"status"') ? null : "unexpected body",
  );
  checks.push({ name: "API health", ...apiHealth, required: true });

  const appRewrite = await probe(`${dashboardUrl}/api/healthz`, (_res, text) =>
    text.trimStart().startsWith("<!") ? "got HTML (rewrite broken)" : null,
  );
  checks.push({ name: "App → API rewrite", ...appRewrite, required: true });

  const clerkCname = await probe(`${clerkHost}/v1/environment`, (_res, text) =>
    text.includes("host_invalid") ? `${clerkHost} host_invalid` : null,
  );
  checks.push({ name: "Clerk CNAME", ...clerkCname, required: true });

  const clerkProxy = await probe(`${dashboardUrl}/api/__clerk/v1/environment`, (_res, text) => {
    if (text.includes("host_invalid") || text.includes("Invalid host")) {
      return "SKIP";
    }
    return null;
  });
  const proxyDetail =
    clerkProxy.detail === "SKIP"
      ? "not used — CNAME mode (expected)"
      : clerkProxy.ok
        ? "proxy responding"
        : clerkProxy.detail;
  checks.push({
    name: "Clerk proxy (optional)",
    ok: true,
    detail: proxyDetail,
    required: false,
  });

  const allRequiredOk = checks.filter((c) => c.required).every((c) => c.ok);

  return {
    checkedAt: new Date().toISOString(),
    dashboardUrl,
    apiUrl,
    allRequiredOk,
    checks,
  };
}

export type FounderCommandCenterLink = {
  id: string;
  label: string;
  href: string;
  description?: string;
  kind: "customer" | "internal" | "external";
};

export function buildFounderCommandCenterLinks(): {
  links: FounderCommandCenterLink[];
  internalPortalBase: string;
} {
  const dashboard = getDashboardUrl();
  const marketing = getMarketingUrl();
  const api = getApiPublicUrl();
  const internal = getInternalUrl();
  const demoOn = isDemoPortalEnabled();

  const links: FounderCommandCenterLink[] = [
    {
      id: "sign-in",
      label: "Owner app (sign in)",
      href: `${dashboard}/sign-in`,
      description: "Customer-facing dashboard",
      kind: "customer",
    },
    {
      id: "marketing",
      label: "Marketing site",
      href: marketing,
      description: "livia-hq.com home + waitlist",
      kind: "customer",
    },
    {
      id: "api-health",
      label: "API health JSON",
      href: `${api}/api/healthz`,
      kind: "external",
    },
    {
      id: "support",
      label: "Support queue",
      href: `${internal}/support`,
      description: "Internal portal — tickets",
      kind: "internal",
    },
    {
      id: "tenants",
      label: "Tenant directory",
      href: `${internal}/tenants`,
      kind: "internal",
    },
    {
      id: "monitoring",
      label: "Monitoring",
      href: `${internal}/monitoring`,
      kind: "internal",
    },
    {
      id: "flags",
      label: "Feature flags",
      href: `${internal}/flags`,
      kind: "internal",
    },
  ];

  if (demoOn) {
    links.splice(1, 0, {
      id: "demo",
      label: "Demo gateway",
      href: `${dashboard}/demo`,
      description: "Demo portal enabled on this API",
      kind: "customer",
    });
  }

  const github = process.env.FOUNDER_GITHUB_URL?.trim() || "https://github.com/goldspire-global/livia";
  links.push({
    id: "github",
    label: "GitHub repo",
    href: github,
    kind: "external",
  });

  const vercel = process.env.FOUNDER_VERCEL_URL?.trim();
  if (vercel) {
    links.push({ id: "vercel", label: "Vercel", href: vercel, kind: "external" });
  }

  const railway = process.env.FOUNDER_RAILWAY_URL?.trim();
  if (railway) {
    links.push({ id: "railway", label: "Railway", href: railway, kind: "external" });
  }

  return { links, internalPortalBase: internal };
}

export function buildFounderReleaseChecklist(productionAllOk: boolean): {
  mode: "solo-pre-staging";
  betaSignupMode: string;
  demoEnabled: boolean;
  stagingRelaxations: ReturnType<typeof getStagingRelaxations>;
  steps: Array<{ id: string; label: string; done: boolean; hint?: string }>;
} {
  return {
    mode: "solo-pre-staging",
    betaSignupMode: getBetaSignupMode(),
    demoEnabled: isDemoPortalEnabled(),
    stagingRelaxations: getStagingRelaxations(),
    steps: [
      {
        id: "ci",
        label: "GitHub CI green on commit you ship",
        done: false,
        hint: "Check Actions before merge",
      },
      {
        id: "smoke",
        label: "Production smoke (below) all required checks pass",
        done: productionAllOk,
      },
      {
        id: "sign-in",
        label: "Manual sign-in on app URL (incognito)",
        done: false,
        hint: "After Vercel deploy finishes",
      },
      {
        id: "changelog",
        label: "Customer-visible note in docs/changelog.md (if user-facing)",
        done: false,
      },
    ],
  };
}

export const FOUNDER_STAGING_PREP_CHECKLIST = [
  "Second Supabase project (staging DB) — never share prod credentials",
  "Second Clerk application (test keys on staging)",
  "Railway service: api.staging.livia-hq.com + env from railway.env.example",
  "Vercel projects: app.staging + marketing staging",
  "DNS: app.staging.livia-hq.com, api.staging.livia-hq.com",
  "CORS_ALLOWED_ORIGINS includes staging origins",
  "Promote flow: merge → staging smoke → promote same SHA to prod",
] as const;

export function buildFounderStagingPrep(): {
  status: "not_provisioned" | "partial";
  note: string;
  checklist: readonly string[];
} {
  const hasStagingApi = Boolean(
    process.env.API_STAGING_URL?.trim() ||
      process.env.STAGING_API_PUBLIC_URL?.trim() ||
      getApiPublicUrl().includes("staging."),
  );
  return {
    status: hasStagingApi ? "partial" : "not_provisioned",
    note: "Defer until design partners — saves ~2 hosted stacks. Prep items below cost nothing until you click Create.",
    checklist: FOUNDER_STAGING_PREP_CHECKLIST,
  };
}
