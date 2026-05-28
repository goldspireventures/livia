import { provisionDemoWorld } from "../src/services/demo-portal.service.ts";

const result = await provisionDemoWorld();
console.log(`\n✓ Demo world: ${result.businesses.length} businesses`);
for (const b of result.businesses) {
  console.log(`  · ${b.slug}`);
}
console.log(`✓ Personas: ${result.personas.map((p) => p.id).join(", ")}\n`);
