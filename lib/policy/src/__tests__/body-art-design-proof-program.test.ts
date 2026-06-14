import assert from "node:assert/strict";
import {
  allowedPublishRightsForKind,
  canShowOnPublicGallery,
  defaultPublishRightForKind,
  inferProofKindFromNote,
  isBodyArtSkinPreviewEnabled,
  isBodyArtSkinPreviewAiConfigured,
  isValidPublishRightForKind,
  parseDesignProofGuestFeedback,
  resolveBodyArtSkinPreviewPhase,
  stripDesignProofGuestFeedback,
  designProofThreadKey,
  canGuestReviewDesignProof,
  sortDesignProofRevisionsAsc,
} from "../body-art-design-proof-program";

assert.equal(defaultPublishRightForKind("flash"), "flash_resell_ok");
assert.equal(defaultPublishRightForKind("custom_commission"), "private");
assert.equal(defaultPublishRightForKind("client_supplied"), "private");

assert.deepEqual(allowedPublishRightsForKind("flash"), ["private", "flash_resell_ok"]);
assert.deepEqual(allowedPublishRightsForKind("custom_commission"), ["private", "portfolio_ok"]);
assert.deepEqual(allowedPublishRightsForKind("client_supplied"), ["private"]);

assert.equal(isValidPublishRightForKind("custom_commission", "flash_resell_ok"), false);
assert.equal(isValidPublishRightForKind("flash", "flash_resell_ok"), true);

assert.equal(canShowOnPublicGallery("private"), false);
assert.equal(canShowOnPublicGallery("portfolio_ok"), true);
assert.equal(canShowOnPublicGallery("flash_resell_ok"), true);

assert.equal(inferProofKindFromNote("Anchor & rope — chest flash"), "flash");

assert.equal(resolveBodyArtSkinPreviewPhase("local"), "off");
assert.equal(resolveBodyArtSkinPreviewPhase("staging"), "off");
assert.equal(resolveBodyArtSkinPreviewPhase("production"), "off");
assert.equal(
  resolveBodyArtSkinPreviewPhase("staging", { VITE_LIVIA_BODY_ART_SKIN_PREVIEW: "phase2" }),
  "off",
);
assert.equal(
  resolveBodyArtSkinPreviewPhase("local", { VITE_LIVIA_BODY_ART_SKIN_PREVIEW: "phase2" }),
  "phase2",
);
assert.equal(
  resolveBodyArtSkinPreviewPhase("local", { VITE_LIVIA_BODY_ART_SKIN_PREVIEW: "phase3" }),
  "phase3",
);
assert.equal(
  resolveBodyArtSkinPreviewPhase("local", { VITE_LIVIA_BODY_ART_SKIN_PREVIEW: "true" }),
  "phase2",
);
assert.equal(
  resolveBodyArtSkinPreviewPhase("local", { VITE_LIVIA_BODY_ART_SKIN_PREVIEW: "phase1" }),
  "off",
);
assert.equal(isBodyArtSkinPreviewEnabled("staging"), false);
assert.equal(isBodyArtSkinPreviewEnabled("local"), false);
assert.equal(
  isBodyArtSkinPreviewEnabled("local", { VITE_LIVIA_BODY_ART_SKIN_PREVIEW: "phase2" }),
  true,
);
assert.equal(isBodyArtSkinPreviewAiConfigured({}), false);
assert.equal(
  isBodyArtSkinPreviewAiConfigured({ VITE_LIVIA_BODY_ART_SKIN_AI_KEY: "sk-test" }),
  true,
);

assert.equal(
  parseDesignProofGuestFeedback("Serpent — forearm\n\n— Guest: Make the snake smaller"),
  "Make the snake smaller",
);
assert.equal(stripDesignProofGuestFeedback("Serpent — forearm\n\n— Guest: tweak"), "Serpent — forearm");

assert.equal(designProofThreadKey("Serpent & bloom — half sleeve"), "serpent & bloom");
assert.equal(canGuestReviewDesignProof("pending_review", true), true);
assert.equal(canGuestReviewDesignProof("pending_review", false), false);
assert.equal(canGuestReviewDesignProof("rejected", true), false);
assert.deepEqual(
  sortDesignProofRevisionsAsc([
    { version: 3, imageUrl: "c" },
    { version: 1, imageUrl: "a" },
  ]),
  [
    { version: 1, imageUrl: "a" },
    { version: 3, imageUrl: "c" },
  ],
);

console.log("body-art-design-proof-program.test.ts: ok");
