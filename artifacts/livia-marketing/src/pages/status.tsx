import { useEffect, useState } from "react";
import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { EditorialArticle } from "@/components/editorial-article";
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
      const api = await probe(`${apiBaseUrl}/api/healthz`);
      next.push({ name: "API", ...api });
      const dash = await probe(dashboardDemoUrl.replace(/\/demo$/, "") || dashboardDemoUrl);
      next.push({ name: "Dashboard (app)", ...dash });
      const demo = await probe(`${apiBaseUrl}/api/demo/status`);
      next.push({
        name: "Demo world",
        ok: demo.ok,
        detail: demo.ok ? "Provisioned" : demo.detail,
      });
      next.push({ name: `Marketing (${marketingOrigin})`, ok: true, detail: "You are viewing it" });
      setChecks(next);
      setLoading(false);
    }
    void run();
  }, []);

  const allOk = checks.every((c) => c.ok);

  return (
    <MarketingLayout>
      <EditorialArticle>
        <EditorialPageHeader
          title="Status"
          subtitle={
            <>
              EU platform health. Production incidents:{" "}
              <a
                href={`${marketingOrigin}/status`}
                className="text-aurora-cyan hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                {marketingOrigin.replace(/^https?:\/\//, "")}/status
              </a>
            </>
          }
        />

        {loading ? (
          <p className="text-sm text-muted-foreground mt-10">Checking…</p>
        ) : (
          <>
            <div
              className={`inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm mt-10 mb-8 ${
                allOk ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {allOk ? "All checks passing" : "Degraded"}
            </div>
            <ul className="space-y-4 border-t border-white/10 pt-6">
              {checks.map((c) => (
                <li
                  key={c.name}
                  className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 border-b border-border/50 pb-4"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className={`text-sm ${c.ok ? "text-emerald-400" : "text-amber-400"}`}>
                    {c.ok ? "OK" : "Issue"} — {c.detail}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </EditorialArticle>
    </MarketingLayout>
  );
}

