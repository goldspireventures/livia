import { createClerkClient } from "@clerk/express";

const clerkId = process.argv[2] ?? "user_3Fa2cJWMEw5IuG34ksUITMJDRVN";
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const pk = process.env.CLERK_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
console.log("env pk prefix", pk ? `${pk.slice(0, 12)}...` : "missing");

const sessions = await clerk.sessions.getSessionList({ userId: clerkId, status: "active", limit: 1 });
const sid = sessions.data[0]?.id;
console.log("active session", sid ?? "none");
if (!sid) process.exit(1);

const tokenRes = await clerk.sessions.getToken(sid);
const token = tokenRes.jwt;

for (const url of ["https://api.livia-hq.com/api/me", "https://app.livia-hq.com/api/me"]) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  console.log(url, res.status, text.slice(0, 240));
}
