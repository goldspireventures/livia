import { provisionDemoWorld } from "../src/services/demo-portal.service.ts";

const repair = process.argv.includes("--repair");
const result = await provisionDemoWorld(repair ? { repair: true } : undefined);
console.log(`\n✓ Demo world${repair ? " (repair)" : ""}: ${result.businesses.length} businesses`);
for (const b of result.businesses) {
  console.log(`  · ${b.slug}`);
}
console.log(`✓ Personas: ${result.personas.map((p) => p.id).join(", ")}\n`);
