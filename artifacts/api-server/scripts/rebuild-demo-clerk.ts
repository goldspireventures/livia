/**
 * Recreate demo Clerk users after `demo:clerk-prune` (globals + owners + roster pool).
 *
 *   pnpm demo:clerk-rebuild
 */
import { rebuildDemoClerkUsers } from "../src/services/demo-portal.service";

async function main(): Promise<void> {
  const result = await rebuildDemoClerkUsers();
  console.log(
    JSON.stringify(
      {
        ok: true,
        personas: result.personas,
        owners: result.owners,
        rosterAccounts: result.rosterAccounts,
      },
      null,
      2,
    ),
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
