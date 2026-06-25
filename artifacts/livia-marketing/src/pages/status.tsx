import { useEffect, useState } from "react";
import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationInnerPage } from "@/components/constellation/constellation-inner-page";
import { ConstellationGlassCard } from "@/components/constellation/constellation-spine";
import { apiBaseUrl, dashboardDemoUrl, marketingOrigin } from "@/lib/marketing-links";

type Check = { name: string; ok: boolean; detail?: string };

async function probe(url: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return { ok: res.ok, detail: String(res.status) };
  } catch {
    return { ok: false, detail: "Unreachable" };
  }
}

export default function StatusPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      const next: Check[] = [];
      const api = await probe(`${apiBaseUrl()}/api/healthz`);
      next.push({ name: "API", ...api });
      const dashOrigin = dashboardDemoUrl().replace(/\/demo$/, "");
      const dash = await probe(dashOrigin || dashboardDemoUrl());
      next.push({ name: "Dashboard (app)", ...dash });
      const demo = await probe(`${apiBaseUrl()}/api/demo/status`);
      next.push({
        name: "Demo world",
        ok: demo.ok,
        detail: demo.ok ? "Provisioned" : demo.detail,
      });
      next.push({ name: `Marketing (${marketingOrigin()})`, ok: true, detail: "You are viewing it" });
      setChecks(next);
      setLoading(false);
    }
    void run();
  }, []);

  const allOk = checks.every((c) => c.ok);

  return (
    <MarketingLayout>
      <ConstellationInnerPage narrow>
        <ConstellationPageHeader
          eyebrow="Platform health"
          title={
            <>
              System <em>status</em>
            </>
          }
          subtitle={
            <>
              EU platform health. Production incidents:{" "}
              <a
                href={`${marketingOrigin()}/status`}
                className="cst-page-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {marketingOrigin().replace(/^https?:\/\//, "")}/status
              </a>
            </>
          }
        />

        {loading ? (
          <p className="text-sm text-muted-foreground mt-10" aria-live="polite">
            Checking…
          </p>
        ) : (
          <>
            <div
              className={`cst-status-badge mt-10 mb-8 ${allOk ? "cst-status-badge--ok" : "cst-status-badge--warn"}`}
              role="status"
              aria-live="polite"
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {allOk ? "All checks passing" : "Degraded"}
            </div>
            <ConstellationGlassCard className="p-6">
              <ul className="space-y-4">
                {checks.map((c) => (
                  <li key={c.name} className="cst-status-row">
                    <span className="font-medium">{c.name}</span>
                    <span className={`text-sm ${c.ok ? "text-emerald-400" : "text-amber-400"}`}>
                      {c.ok ? "OK" : "Issue"} — {c.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </ConstellationGlassCard>
          </>
        )}
      </ConstellationInnerPage>
    </MarketingLayout>
  );
}
