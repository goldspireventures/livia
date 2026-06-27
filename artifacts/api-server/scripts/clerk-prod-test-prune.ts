/**
 * Remove synthetic test/E2E founder accounts from Clerk (prod or dev).
 *
 *   pnpm clerk:prod:prune
 *   pnpm clerk:prod:prune:execute
 */
import { createClerkClient } from "@clerk/express";
import { isDemoLiviaEmail } from "@workspace/demo-logins";

const execute = process.argv.includes("--execute");
const allowTest = process.argv.includes("--allow-test-instance");

const secret =
  process.env.CLERK_PROD_SECRET_KEY?.trim() ?? process.env.CLERK_SECRET_KEY?.trim();
if (!secret) {
  console.error("Set CLERK_PROD_SECRET_KEY or CLERK_SECRET_KEY");
  process.exit(1);
}

const isLive = secret.startsWith("sk_live_");
if (!isLive && !allowTest) {
  console.error(
    "Refusing to prune on sk_test_ without --allow-test-instance (use pnpm demo:clerk-prune for demo world).",
  );
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: secret });

function isSyntheticTestEmail(email: string): boolean {
  const e = email.toLowerCase();
  if (!e) return false;
  if (isDemoLiviaEmail(e)) return false;
  if (e.endsWith("@demo.livia-hq.com")) return false;
  if (e.endsWith("@signup-test.livia-hq.com")) return true;
  if (e.includes("sacred-e2e")) return true;
  if (e.includes("e2e-founder") || e.includes("e2e@")) return true;
  if (e.includes("pls-wave") || e.includes("visual-audit")) return true;
  if (e.startsWith("demo-owner-") && e.endsWith("@livia.io")) return true;
  if (e.includes("+clerk_test")) return true;
  if (e.endsWith("@livia.io") && (e.includes("test") || e.includes("e2e"))) return true;
  return false;
}

function primaryEmail(user: {
  emailAddresses?: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId?: string | null;
}): string | null {
  const list = user.emailAddresses ?? [];
  if (!list.length) return null;
  const pid = user.primaryEmailAddressId;
  const row = pid ? list.find((x) => x.id === pid) : list[0];
  return row?.emailAddress?.toLowerCase() ?? null;
}

async function listAllUsers() {
  const all: Awaited<ReturnType<typeof clerk.users.getUserList>>["data"] = [];
  let offset = 0;
  for (;;) {
    const page = await clerk.users.getUserList({ limit: 100, offset });
    all.push(...page.data);
    if (page.data.length < 100) break;
    offset += page.data.length;
  }
  return all;
}

async function main() {
  console.log(
    execute ? "EXECUTE — deleting synthetic test users" : "DRY RUN — pass --execute to delete",
  );
  console.log(`Clerk instance: ${isLive ? "live (prod)" : "test (dev)"}`);

  const users = await listAllUsers();
  const toDelete: Array<{ id: string; email: string }> = [];

  for (const user of users) {
    const email = primaryEmail(user);
    if (isSyntheticTestEmail(email ?? "")) {
      toDelete.push({ id: user.id, email: email ?? "(no email)" });
    }
  }

  console.log(`\nTotal users: ${users.length} · Synthetic to delete: ${toDelete.length}\n`);
  for (const row of toDelete.slice(0, 50)) {
    console.log(`  DELETE  ${row.email}  ${row.id}`);
  }
  if (toDelete.length > 50) console.log(`  … and ${toDelete.length - 50} more`);

  if (!execute) {
    console.log("\nDry run complete.");
    return;
  }

  let deleted = 0;
  for (const row of toDelete) {
    try {
      await clerk.users.deleteUser(row.id);
      deleted++;
      console.log(`✓ deleted ${row.email}`);
    } catch (err) {
      console.warn(`✗ failed ${row.email}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`\nDeleted ${deleted}/${toDelete.length} synthetic user(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
