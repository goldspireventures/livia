import fs from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve the repo `docs/` directory. The `../../../../docs` offset is correct
 * for the TS source location (src/services), but the API ships bundled to
 * `dist/index.mjs` (one level shallower), so a single hardcoded relative path
 * resolves above the repo root at runtime and the ops-console doc index comes
 * back empty. Probe the plausible locations and use the first that exists.
 */
function resolveDocRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "../../../../docs"), // tsx from src/services
    path.resolve(here, "../../../docs"), // bundled dist/
    path.resolve(process.cwd(), "docs"), // cwd = repo root
    path.resolve(process.cwd(), "../../docs"), // cwd = artifacts/api-server
  ];
  for (const candidate of candidates) {
    try {
      if (existsSync(candidate) && statSync(candidate).isDirectory()) return candidate;
    } catch {
      /* try next */
    }
  }
  return candidates[0]!;
}

const DOC_ROOT = resolveDocRoot();

const ALLOWED_EXTENSIONS = new Set([".md", ".mdx", ".txt"]);

export type CompanyDocEntry = {
  path: string;
  title: string;
  category: string;
  isCanonical: boolean;
};

function safeResolve(relativePath: string): string | null {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.resolve(DOC_ROOT, normalized);
  if (!full.startsWith(DOC_ROOT)) return null;
  return full;
}

async function walkDocs(dir: string, prefix = ""): Promise<CompanyDocEntry[]> {
  const entries: CompanyDocEntry[] = [];
  let items: Array<{ name: string; isDirectory: () => boolean }>;
  try {
    items = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return entries;
  }
  for (const item of items) {
    const rel = prefix ? `${prefix}/${item.name}` : item.name;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === "node_modules" || item.name.startsWith(".")) continue;
      entries.push(...(await walkDocs(full, rel)));
      continue;
    }
    const ext = path.extname(item.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;
    const title = item.name.replace(/\.(md|mdx|txt)$/i, "").replace(/-/g, " ");
    const category = rel.split("/")[0] ?? "root";
    entries.push({
      path: rel.replace(/\\/g, "/"),
      title,
      category,
      isCanonical:
        rel.includes("DOC-CANONICAL-INDEX") ||
        rel.includes("BETA-SHOWCASE-PROGRAM") ||
        rel.includes("OPERATOR-READY-PACK") ||
        rel.includes("SUPPORT-RUNBOOK") ||
        rel.includes("incident-response"),
    });
  }
  return entries;
}

export async function listCompanyDocs(): Promise<{
  root: string;
  total: number;
  categories: string[];
  docs: CompanyDocEntry[];
}> {
  const docs = await walkDocs(DOC_ROOT);
  docs.sort((a, b) => {
    if (a.isCanonical !== b.isCanonical) return a.isCanonical ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
  const categories = [...new Set(docs.map((d) => d.category))].sort();
  return {
    root: "docs",
    total: docs.length,
    categories,
    docs,
  };
}

export async function readCompanyDoc(relativePath: string): Promise<{
  path: string;
  content: string;
} | null> {
  const full = safeResolve(relativePath);
  if (!full) return null;
  const ext = path.extname(full).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;
  try {
    const stat = await fs.stat(full);
    if (!stat.isFile() || stat.size > 512_000) return null;
    const content = await fs.readFile(full, "utf8");
    return { path: relativePath.replace(/\\/g, "/"), content };
  } catch {
    return null;
  }
}

export async function getCompanyDocsIndex(): Promise<{
  canonical: CompanyDocEntry[];
  byCategory: Record<string, CompanyDocEntry[]>;
}> {
  const { docs } = await listCompanyDocs();
  const canonical = docs.filter((d) => d.isCanonical);
  const byCategory: Record<string, CompanyDocEntry[]> = {};
  for (const d of docs) {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push(d);
  }
  return { canonical, byCategory };
}
