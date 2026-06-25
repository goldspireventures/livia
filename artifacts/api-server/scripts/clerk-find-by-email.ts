import { createClerkClient } from "@clerk/express";

const email = process.argv[2]?.toLowerCase();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const r = await clerk.users.getUserList({ emailAddress: [email], limit: 5 });
console.log("by emailAddress filter:", r.data.map((u) => u.id + " " + u.emailAddresses?.map((e) => e.emailAddress).join()));
