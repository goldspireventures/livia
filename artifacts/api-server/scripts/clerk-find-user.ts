import { createClerkClient } from "@clerk/express";

const q = process.argv[2] ?? "imdglobal";
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const r = await clerk.users.getUserList({ query: q, limit: 20 });
for (const u of r.data) {
  console.log(u.id, u.emailAddresses?.map((e) => e.emailAddress).join(", "));
}
console.log("total", r.data.length);
