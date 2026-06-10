import { seedDemoGuestHub } from "../src/services/demo-guest-hub.seed.ts";

const result = await seedDemoGuestHub();
console.log("\n✓ Demo guest hub (Mary)");
console.log(`  guestId:          ${result.guestId}`);
console.log(`  shopsLinked:      ${result.shopsLinked}`);
console.log(`  upcomingEnsured:  ${result.upcomingEnsured}`);
console.log("");
