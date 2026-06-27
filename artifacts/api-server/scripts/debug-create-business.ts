import { createBusiness } from "../src/services/businesses.service";
import { onBusinessCreated } from "../src/platform/lifecycle";
import { seedBusinessFromOnboardingPack } from "../src/services/onboarding.service";

const ownerId = "user_3Fa2cJWMEw5IuG34ksUITMJDRVN";

async function main() {
  try {
    const biz = await createBusiness(ownerId, {
      name: "IMD Allied Health",
      slug: "imd-allied-health-test-" + Date.now(),
      timezone: "Europe/Dublin",
      country: "IE",
      vertical: "allied-health",
      category: "Allied health",
      subverticalProfileId: "allied.physio",
      tier: "solo",
      tenantAttestation: {
        entityKind: "sole_trader",
        tradingName: "IMD Allied Health",
        attestedAt: new Date().toISOString(),
      },
    });
    console.log("created", biz.id, biz.slug);
    await onBusinessCreated(
      {
        businessId: biz.id,
        ownerId,
        vertical: biz.vertical as "allied-health",
        slug: biz.slug,
        name: biz.name,
      },
      { starterPack: false, seedDefaults: false },
      {},
    );
    console.log("lifecycle ok");
  } catch (e) {
    console.error("FAIL", e);
    process.exit(1);
  }
  process.exit(0);
}

main();
