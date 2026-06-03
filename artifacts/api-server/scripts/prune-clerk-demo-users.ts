/**
 * Delete Clerk users that are synthetic demo accounts but NOT per-shop owners.
 *
 * Keeps: owner-bloom@demo.livia-hq.com, owner-harbour@…, etc. (~one per demo business)
 * Deletes: manager-bloom@…, staff-*@…, orphaned demo sign-ups, legacy role clutter
 *
 *   pnpm demo:clerk-prune              # dry-run (default)
 *   pnpm demo:clerk-prune -- --execute
 *   pnpm demo:clerk-prune -- --execute --keep-globals  # also keep manager@demo, org-admin, …
 */
import { createClerkClient } from "@clerk/express";
import { DEMO_ROLE_EMAILS, demoOwnerEmailForSlug, isDemoLiviaEmail } from "@workspace/demo-logins";
import { DEMO_WORLD_SLUGS } from "../src/lib/demo-portal-config";

const execute = process.argv.includes("--execute");
const keepGlobals = process.argv.includes("--keep-globals");

const secretKey = process.env.CLERK_SECRET_KEY?.trim();
if (!secretKey) {
  console.error("CLERK_SECRET_KEY is required (use --env-file=.env)");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey });

const keepEmails = new Set<string>();
for (const slug of DEMO_WORLD_SLUGS) {
  keepEmails.add(demoOwnerEmailForSlug(slug).toLowerCase());
}
if (keepGlobals) {
  for (const email of Object.values(DEMO_ROLE_EMAILS)) {
    keepEmails.add(email.toLowerCase());
  }
}

function primaryEmail(user: {
  emailAddresses?: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId?: string | null;
}): string | null {
  const list = user.emailAddresses ?? [];
  if (!list.length) return null;
  const pid = user.primaryEmailAddressId;
  const row = pid ? list.find((e) => e.id === pid) : list[0];
  return row?.emailAddress?.toLowerCase() ?? null;
}

function shouldKeep(email: string | null): { keep: boolean; reason: string } {
  if (!email) return { keep: true, reason: "no-email" };
  if (!isDemoLiviaEmail(email)) return { keep: true, reason: "non-demo" };
  if (keepEmails.has(email)) return { keep: true, reason: "shop-owner" };
  return { keep: false, reason: "synthetic-demo" };
}

async function listAllUsers() {
  const all: Awaited<ReturnType<typeof clerk.users.getUserList>>["data"] = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const page = await clerk.users.getUserList({ limit, offset });
    all.push(...page.data);
    if (page.data.length < limit) break;
    offset += page.data.length;
  }
  return all;
}

async function main() {
  console.log(execute ? "EXECUTE — deleting users" : "DRY RUN — pass --execute to delete");
  console.log(`Shop owners kept: ${keepEmails.size} slugs from DEMO_WORLD_SLUGS`);
  if (keepGlobals) console.log("Also keeping global DEMO_ROLE_EMAILS (--keep-globals)");

  const users = await listAllUsers();
  const toDelete: Array<{ id: string; email: string; reason: string }> = [];
  const kept: Array<{ email: string; reason: string }> = [];

  for (const user of users) {
    const email = primaryEmail(user);
    const { keep, reason } = shouldKeep(email);
    if (keep) {
      if (email && isDemoLiviaEmail(email)) kept.push({ email, reason });
      continue;
    }
    toDelete.push({
      id: user.id,
      email: email ?? "(no email)",
      reason,
    });
  }

  console.log(`\nClerk users total: ${users.length}`);
  console.log(`Keep (demo shop owners${keepGlobals ? " + globals" : ""}): ${kept.length}`);
  for (const k of kept.sort((a, b) => a.email.localeCompare(b.email))) {
    console.log(`  ✓ ${k.email} (${k.reason})`);
  }

  console.log(`\nDelete candidates: ${toDelete.length}`);
  for (const d of toDelete.sort((a, b) => a.email.localeCompare(b.email))) {
    console.log(`  ✗ ${d.email} — ${d.id}`);
  }

  if (!execute) {
    console.log("\nNo users deleted. Re-run with --execute to apply.");
    return;
  }

  if (toDelete.length === 0) {
    console.log("\nNothing to delete.");
    return;
  }

  let deleted = 0;
  for (const row of toDelete) {
    await clerk.users.deleteUser(row.id);
    deleted += 1;
    console.log(`Deleted ${row.email}`);
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log(`\nDeleted ${deleted} Clerk user(s). Run Sync logins on /demo to recreate pooled roles.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
