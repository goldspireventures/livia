import { seedDemoGuestHub } from "../src/services/demo-guest-hub.seed";
import { seedOperatorLivWorld } from "../src/services/demo-operator-liv-world.seed";
import { verifyDemoGuestWorld } from "../src/services/demo-guest-world.verify";

const guestHub = await seedDemoGuestHub();
const operatorLiv = await seedOperatorLivWorld();
const check = await verifyDemoGuestWorld();

console.log(JSON.stringify({ guestHub, operatorLiv, check }, null, 2));
process.exit(check.ok ? 0 : 1);
