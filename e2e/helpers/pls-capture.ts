import path from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import type { Page, APIRequestContext } from "@playwright/test";
import { scanText } from "../../scripts/pls-forbidden-copy.mjs";

export type PlsStepRecord = {
  scenarioId: string;
  persona: string;
  surface: string;
  route: string;
  screenshot: string;
  contentHits: string[];
  outcome: "pass" | "fail" | "degraded";
  wave: number;
};

export function plsOutRoot(wave: number, runDate?: string) {
  const date = runDate ?? process.env.PLS_RUN_DATE ?? new Date().toISOString().slice(0, 10);
  return {
    date,
    dir: path.join(process.cwd(), "..", "artifacts", "pls", `wave${wave}-${date}`),
    manifestPath: path.join(process.cwd(), "..", "artifacts", "pls", `wave${wave}-${date}`, "manifest.json"),
  };
}

export function slugifyRoute(s: string) {
  const base = s.replace(/^\//, "").replace(/[?&=]/g, "-") || "home";
  return base.replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "");
}

export class PlsCaptureRun {
  readonly records: PlsStepRecord[] = [];

  constructor(
    readonly wave: number,
    readonly outDir: string,
    readonly runDate: string,
  ) {
    mkdirSync(outDir, { recursive: true });
  }

  async capture(page: Page, meta: Omit<PlsStepRecord, "screenshot" | "contentHits" | "outcome" | "wave">) {
    await page.waitForTimeout(600);
    const hits = scanText(await page.locator("body").innerText()).map((h) => h.id);
    const file = `${meta.scenarioId}.png`;
    const outPath = path.join(this.outDir, file);
    await page.screenshot({ path: outPath, fullPage: true });
    const record: PlsStepRecord = {
      ...meta,
      wave: this.wave,
      screenshot: `artifacts/pls/wave${this.wave}-${this.runDate}/${file}`,
      contentHits: hits,
      outcome: hits.length > 0 ? "fail" : "pass",
    };
    this.records.push(record);
    if (hits.length > 0) {
      console.warn(`[PLS W${this.wave}] ${meta.scenarioId}: ${hits.join(", ")}`);
    }
    return record;
  }

  flush() {
    writeFileSync(path.join(this.outDir, "manifest.json"), JSON.stringify(this.records, null, 2));
  }

  contentFailures() {
    return this.records.filter((m) => m.contentHits.length > 0);
  }
}

export type DemoBusiness = {
  slug: string;
  vertical: string;
  publicBookingUrl?: string;
};

export async function fetchDemoBusinesses(request: APIRequestContext, apiBase: string): Promise<DemoBusiness[]> {
  const res = await request.get(`${apiBase}/api/demo/status`);
  if (!res.ok()) return [];
  const body = (await res.json()) as { businesses?: DemoBusiness[] };
  return body.businesses ?? [];
}

export function publicBookPath(biz: DemoBusiness): string | null {
  const url = biz.publicBookingUrl ?? "";
  if (url.includes("/e/")) return `/e/${biz.slug}`;
  if (url.includes("/book/") || biz.slug) return `/b/${biz.slug}`;
  return null;
}

export function mergeManifest(wave: number, runDate: string) {
  const root = path.join(process.cwd(), "..", "artifacts", "pls");
  const combinedPath = path.join(root, runDate, "manifest-all-waves.json");
  const waveDirs = [1, 2, 3, 4, 5]
    .map((w) => path.join(root, `wave${w}-${runDate}`, "manifest.json"))
    .filter((p) => existsSync(p));
  const all: PlsStepRecord[] = [];
  for (const p of waveDirs) {
    try {
      all.push(...(JSON.parse(readFileSync(p, "utf8")) as PlsStepRecord[]));
    } catch {
      /* skip */
    }
  }
  mkdirSync(path.join(root, runDate), { recursive: true });
  writeFileSync(combinedPath, JSON.stringify(all, null, 2));
}
