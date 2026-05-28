import { PRE_MERGE_GOLDEN_CHECKS } from "./golden";

async function main(): Promise<void> {
  let failed = 0;
  for (const check of PRE_MERGE_GOLDEN_CHECKS) {
    try {
      await check.run();
      console.log(`  ✓ ${check.name}`);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${check.name}: ${msg}`);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} golden check(s) failed`);
    process.exit(1);
  }
  console.log(`\n${PRE_MERGE_GOLDEN_CHECKS.length} golden checks passed`);
}

main();
