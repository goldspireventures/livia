import { getOrCreateUser } from "../src/services/users.service";
import { getBusinessesForUser } from "../src/services/businesses.service";

const clerkId = "user_3Fa2cJWMEw5IuG34ksUITMJDRVN";
const email = "imdglobal@gmx.com";

try {
  const user = await getOrCreateUser(clerkId, email);
  console.log("user", user.id, user.email, user.platformLegal);
  const businesses = await getBusinessesForUser(clerkId);
  console.log("businesses", businesses.length, businesses.map((b) => b.slug));
} catch (e) {
  console.error("FAIL", e);
  process.exit(1);
}
process.exit(0);
