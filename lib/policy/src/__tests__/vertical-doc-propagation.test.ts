/**
 * Doc propagation guard — vertical hub must match doc spokes.
 * Run: pnpm vertical:doc-check
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { businessVerticalSchema } from "../types";
import { VERTICAL_COVERAGE_REGISTRY } from "../vertical-coverage";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** Full L0–L8 program doc per code vertical — must exist and appear in master index. */
const VERTICAL_PROGRAM_DOC: Record<(typeof businessVerticalSchema.options)[number], string> = {
  hair: "docs/product/HAIR-VERTICAL-PROGRAM.md",
  beauty: "docs/product/BEAUTY-VERTICAL-PROGRAM.md",
  wellness: "docs/product/WELLNESS-VERTICAL-PROGRAM.md",
  "body-art": "docs/product/BODY-ART-VERTICAL-PROGRAM.md",
  fitness: "docs/product/FITNESS-VERTICAL-PROGRAM.md",
  medspa: "docs/product/MEDSPA-VERTICAL-PROGRAM.md",
  "allied-health": "docs/product/ALLIED-HEALTH-VERTICAL-PROGRAM.md",
  "pet-grooming": "docs/product/PET-GROOMING-VERTICAL-PROGRAM.md",
  "automotive-detailing": "docs/product/AUTOMOTIVE-DETAILING-VERTICAL-PROGRAM.md",
  "event-vendors": "docs/product/EVENT-VENDORS-VERTICAL-PROGRAM.md",
};

function mustExist(relPath: string, label?: string) {
  const abs = resolve(root, relPath);
  assert.ok(existsSync(abs), `${label ?? relPath} missing at ${relPath}`);
}

function mustInclude(fileRel: string, needle: string, label: string) {
  const body = readFileSync(resolve(root, fileRel), "utf8");
  assert.ok(body.includes(needle), `${label}: ${fileRel} must include "${needle}"`);
}

mustExist("docs/product/VERTICAL-PROGRAMS-INDEX.md", "VERTICAL-PROGRAMS-INDEX");
mustExist("docs/product/LIVIA-VERTICALS-BUILD-PLAN.md", "LIVIA-VERTICALS-BUILD-PLAN");
mustExist("docs/product/PARTNER-AND-ADJACENT-VERTICALS.md", "PARTNER-AND-ADJACENT");
mustInclude(
  "docs/DOC-CANONICAL-INDEX.md",
  "VERTICAL-PROGRAMS-INDEX",
  "DOC-CANONICAL-INDEX programs index",
);
mustInclude(
  "docs/DOC-CANONICAL-INDEX.md",
  "LIVIA-VERTICALS-BUILD-PLAN",
  "DOC-CANONICAL-INDEX build plan",
);

for (const vertical of businessVerticalSchema.options) {
  const programRel = VERTICAL_PROGRAM_DOC[vertical];
  mustExist(programRel, `Program doc for ${vertical}`);
  const baseName = programRel.split("/").pop()!.replace(".md", "");
  mustInclude(
    "docs/product/VERTICAL-PROGRAMS-INDEX.md",
    baseName,
    `VERTICAL-PROGRAMS-INDEX links ${vertical}`,
  );
}

for (const row of VERTICAL_COVERAGE_REGISTRY) {
  const vertical = row.codeVertical;
  if (!vertical) continue;

  const playbook = `docs/product/vertical-playbooks/${vertical}.md`;
  mustExist(playbook, `Playbook for ${vertical}`);
  mustInclude(playbook, "VERTICAL-PROGRAM", `Playbook ${vertical} links program doc`);

  if (row.demoSlug) {
    mustInclude("docs/product/PER-VERTICAL-DEMO-SEED.md", row.demoSlug, "PER-VERTICAL-DEMO-SEED");
    mustInclude("docs/testing/DEMO-LOGINS.md", row.demoSlug, "DEMO-LOGINS");
    const showcaseSeed = readFileSync(
      resolve(root, "artifacts/api-server/src/services/demo-vertical-shops.seed.ts"),
      "utf8",
    );
    const marketSeedPath = resolve(
      root,
      "artifacts/api-server/src/services/demo-market-shops.seed.ts",
    );
    const marketSeed = existsSync(marketSeedPath)
      ? readFileSync(marketSeedPath, "utf8")
      : "";
    const inSeed = showcaseSeed.includes(row.demoSlug) || marketSeed.includes(row.demoSlug);
    assert.ok(
      inSeed,
      `demo seed: ${row.demoSlug} must appear in demo-vertical-shops.seed.ts or demo-market-shops.seed.ts`,
    );
  }
}

mustInclude(
  "docs/operations/FOUNDER-UAT-CHECKLIST.md",
  "bloom-beauty-dublin",
  "FOUNDER-UAT Bloom",
);
mustInclude(
  "docs/operations/FOUNDER-UAT-CHECKLIST.md",
  "clarity-medspa-dublin",
  "FOUNDER-UAT medspa",
);
mustInclude(
  "docs/operations/FOUNDER-UAT-CHECKLIST.md",
  "luxe-salon-spa",
  "FOUNDER-UAT hair",
);

console.log("vertical-doc-propagation.test.ts: ok");
