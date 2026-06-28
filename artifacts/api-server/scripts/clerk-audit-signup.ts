/**
 * One-off audit: users + recent sign-ups for an email (prod CLERK_SECRET_KEY).
 * Usage: pnpm exec tsx scripts/clerk-audit-signup.ts imdglobal@gmx.com
 */
import { createClerkClient } from "@clerk/express";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Usage: tsx scripts/clerk-audit-signup.ts <email>");
  process.exit(1);
}

const secret = process.env.CLERK_SECRET_KEY?.trim();
if (!secret) {
  console.error("Set CLERK_SECRET_KEY (sk_live_ for production)");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: secret });
const instance = secret.startsWith("sk_live_") ? "live (livia-hq.com)" : "test";

async function main() {
  console.log("Clerk instance:", instance);
  console.log("Looking up:", email);
  console.log("");

  const byEmail = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
  console.log("Users (verified accounts):", byEmail.totalCount);
  for (const u of byEmail.data) {
    console.log("  user", u.id, u.emailAddresses?.map((e) => e.emailAddress).join(", "));
  }

  const byQuery = await clerk.users.getUserList({ query: email.split("@")[0], limit: 20 });
  const queryHits = byQuery.data.filter((u) =>
    u.emailAddresses?.some((e) => e.emailAddress.toLowerCase() === email),
  );
  if (queryHits.length && !byEmail.data.length) {
    console.log("Query hits (same email):", queryHits.length);
  }

  // Pending sign-ups (not yet users)
  const signUpsRes = await fetch(
    `https://api.clerk.com/v1/sign_ups?limit=100&offset=0&order_by=-created_at`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  if (!signUpsRes.ok) {
    console.error("sign_ups API:", signUpsRes.status, await signUpsRes.text());
    return;
  }
  const signUps = (await signUpsRes.json()) as Array<{
    id: string;
    status: string;
    email_address?: string;
    created_at?: number;
    verifications?: unknown;
  }>;

  const pending = signUps.filter(
    (s) => (s.email_address ?? "").toLowerCase() === email,
  );
  console.log("");
  console.log("Pending sign-ups (same email, last 100 org-wide):", pending.length);
  for (const s of pending) {
    console.log(
      "  signup",
      s.id,
      "status=" + s.status,
      "created=" + (s.created_at ? new Date(s.created_at).toISOString() : "?"),
    );
    console.log("  verifications:", JSON.stringify(s.verifications));
  }

  if (!byEmail.totalCount && !pending.length) {
    console.log("");
    console.log(
      "No user and no pending sign-up in this Clerk instance — mobile sign-up likely never reached Clerk prod, or used a different pk_ key.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
