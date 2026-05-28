/**
 * One-shot: route handlers res.status(N).json({ error }) → sendError(res, req, N, …)
 * Run: node scripts/migrate-send-error.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const routesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "artifacts/api-server/src/routes");
const HTTP_IMPORT = `import { sendError } from "../lib/http-errors";`;

function migrateFile(filePath) {
  let content = readFileSync(filePath, "utf8");
  if (!content.includes(".json({ error") && !content.includes(".json( { error")) {
    return false;
  }

  const before = content;

  // { error, code, requestId? }
  content = content.replace(
    /res\.status\(([^)]+)\)\.json\(\s*\{\s*error:\s*([^,}]+?)\s*,\s*code:\s*([^,}]+?)(?:\s*,\s*requestId\s*)?\s*\}\s*\)/g,
    "sendError(res, req, $1, $2, { code: $3 })",
  );

  // { error, requestId }
  content = content.replace(
    /res\.status\(([^)]+)\)\.json\(\s*\{\s*error:\s*([^,}]+?)\s*,\s*requestId\s*\}\s*\)/g,
    "sendError(res, req, $1, $2)",
  );

  // { error, code } without requestId
  content = content.replace(
    /res\.status\(([^)]+)\)\.json\(\s*\{\s*error:\s*([^,}]+?)\s*,\s*code:\s*([^}]+?)\s*\}\s*\)/g,
    "sendError(res, req, $1, $2, { code: $3 })",
  );

  // simple { error: … }
  content = content.replace(
    /res\.status\(([^)]+)\)\.json\(\s*\{\s*error:\s*([^}]+?)\s*\}\s*\)/g,
    (full, status, msg) => {
      if (full.includes("sendError")) return full;
      return `sendError(res, req, ${status}, ${msg.trim()})`;
    },
  );

  // gate / middleware using _req
  content = content.replace(/sendError\(res, req,/g, (m, offset) => {
    const slice = content.slice(Math.max(0, offset - 400), offset);
    if (/\(_req\b[^)]*\)\s*=>\s*\{[^}]*$/.test(slice) || /function\s+\w+\(\s*_req/.test(slice)) {
      return "sendError(res, _req,";
    }
    return m;
  });

  if (content === before) return false;

  if (!content.includes('from "../lib/http-errors"')) {
    const lastImport = content.lastIndexOf("\nimport ");
    if (lastImport === -1) return false;
    const lineEnd = content.indexOf("\n", lastImport + 1);
    content = content.slice(0, lineEnd + 1) + HTTP_IMPORT + "\n" + content.slice(lineEnd + 1);
  }

  writeFileSync(filePath, content, "utf8");
  return true;
}

const files = readdirSync(routesDir).filter((f) => f.endsWith(".ts"));
let changed = 0;
for (const f of files) {
  if (migrateFile(join(routesDir, f))) {
    console.log("migrated:", f);
    changed++;
  }
}
console.log(`\nDone. ${changed} file(s) updated.`);
