import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "docs");
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".md")) files.push(full);
  }
}

walk(root);

const header = `# Documentation audit registry

**Status:** in progress (2026-05-30)  
**Purpose:** Track **line-by-line** review of every \`docs/**/*.md\` file.  
**Verdicts:** \`keep\` · \`merge\` · \`archive\` · \`delete\` · \`fix-domain\` · \`expand\`

Automated pass flags: \`archive\` banner in header, \`livia.io\` count, thin (<20 lines).

| Review | Lines | livia.io | File | Verdict | Notes |
|--------|-------|----------|------|---------|-------|
`;

const rows = files.sort().map((file) => {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/).length;
  const liviaIo = (text.match(/livia\.io/gi) ?? []).length;
  const auto =
    /Archived|Superseded|historical reference only/i.test(text.slice(0, 800))
      ? "auto-archive"
      : lines < 20
        ? "auto-thin"
        : "pending";
  return `| ${auto} | ${lines} | ${liviaIo} | \`${rel}\` | | |`;
});

const outPath = path.join(root, "operations", "DOC-AUDIT-REGISTRY.md");
fs.writeFileSync(outPath, header + rows.join("\n") + "\n");
console.log(`Wrote ${files.length} rows to ${outPath}`);
