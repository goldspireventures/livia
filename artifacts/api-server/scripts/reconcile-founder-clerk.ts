import { reconcileClerkUserId } from "../src/services/users.service";

const oldId = "user_3FdQWoITRDq6QaQldGaNsUQHwvq";
const newId = "user_3Fa2cJWMEw5IuG34ksUITMJDRVN";

await reconcileClerkUserId(oldId, newId);
console.log("reconciled", oldId, "->", newId);
process.exit(0);
