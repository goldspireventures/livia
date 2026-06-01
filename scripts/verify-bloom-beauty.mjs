/**
 * Live-style checks for Bloom beauty demo (API + presentation).
 * Usage: node --env-file=.env scripts/verify-bloom-beauty.mjs [apiBase]
 */
const base = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const slug = "bloom-beauty-dublin";
let failed = 0;

function fail(msg) {
  console.log(`  [FAIL] ${msg}`);
  failed += 1;
}
function ok(msg) {
  console.log(`  [OK] ${msg}`);
}

console.log(`\nBloom beauty verify @ ${base}\n`);

try {
  const statusRes = await fetch(`${base}/api/demo/status`);
  if (!statusRes.ok) fail(`demo/status ${statusRes.status}`);
  else {
    const status = await statusRes.json();
    if (!status.provisioned) fail("demo world not provisioned — run pnpm demo:repair");
    else {
      const bloom = (status.businesses ?? []).find((b) => b.slug === slug);
      if (!bloom) fail(`${slug} missing from demo roster`);
      else ok(`demo roster includes ${slug} (${bloom.name})`);
    }
  }

  const pubRes = await fetch(`${base}/api/public/b/${slug}`);
  if (!pubRes.ok) fail(`public profile ${pubRes.status}`);
  else {
    const pub = await pubRes.json();
    if (pub.vertical !== "beauty") fail(`vertical=${pub.vertical}`);
    else ok("public profile vertical=beauty");
    const preset = pub.experienceSkin?.presentation;
    const mode = pub.experienceSkin?.presentationColorMode;
    if (preset !== "noir-dusk") {
      fail(
        `presentation=${preset} (expected noir-dusk) — run pnpm demo:backfill-branding, then restart API (port 3000 must not be a stale process; see pnpm dev:api:kill)`,
      );
    } else ok("public presentation=noir-dusk");
    if (mode === "dark") ok("public presentationColorMode=dark");
    else if (mode == null && preset === "noir-dusk") {
      ok("public presentation=noir-dusk (restart API for presentationColorMode field)");
    } else fail(`presentationColorMode=${mode}`);
    if (!pub.services?.length) fail("no public services");
    else {
      ok(`${pub.services.length} bookable services`);
      const names = (pub.services ?? []).map((s) => s.name);
      if (!names.some((n) => /brow/i.test(n))) {
        fail(`Brow shape missing from public menu (${names.join(", ")}) — run pnpm demo:repair`);
      } else ok("public menu includes brow treatment");
      const brow = pub.services.find((s) => /brow/i.test(s.name));
      if (brow && !brow.imageUrl) fail("Brow shape has no imageUrl on public profile");
      else if (brow) ok("Brow shape has card image");
    }
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

if (failed) {
  console.log(`\n${failed} check(s) failed.\n`);
  process.exitCode = 1;
} else {
  console.log("\nAll Bloom checks passed.\n");
}
