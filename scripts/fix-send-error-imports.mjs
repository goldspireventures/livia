import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const routesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "artifacts/api-server/src/routes");
const SEND = 'import { sendError } from "../lib/http-errors";\n';

for (const f of readdirSync(routesDir).filter((x) => x.endsWith(".ts"))) {
  const p = join(routesDir, f);
  let c = readFileSync(p, "utf8");
  if (!c.includes("sendError")) continue;

  c = c.replace(/import \{\nimport \{ sendError \} from "\.\.\/lib\/http-errors";\n/g, "import {\n");
  c = c.replace(/^import \{ sendError \} from "\.\.\/lib\/http-errors";\n/gm, "");

  if (c.includes("sendError") && !c.includes(SEND.trim())) {
    const idx = c.indexOf("const router");
    if (idx > 0) c = c.slice(0, idx) + SEND + c.slice(idx);
  }

  c = c.replace(
    /sendError\(res, req, (\d+), ([^,]+), details: ([^)]+)\)/g,
    "sendError(res, req, $1, $2, { details: $3 })",
  );

  writeFileSync(p, c, "utf8");
  console.log("fixed:", f);
}
