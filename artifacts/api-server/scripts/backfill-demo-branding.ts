import { backfillAllDemoPublicBranding } from "../src/lib/demo-public-assets.ts";
import { DEMO_WORLD_SLUGS } from "../src/lib/demo-portal-config.ts";
import { getBusinessBySlug, updateBusiness } from "../src/services/businesses.service.ts";

const n = await backfillAllDemoPublicBranding(DEMO_WORLD_SLUGS);

const bloom = await getBusinessBySlug("bloom-beauty-dublin");
if (bloom) {
  await updateBusiness(bloom.id, { presentationPresetId: "beauty-noir-dusk" });
  console.log(`Bloom (${bloom.id}) → beauty-noir-dusk`);
}

console.log(`Updated ${n} businesses`);
