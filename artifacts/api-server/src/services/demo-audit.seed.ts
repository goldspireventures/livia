import { appendHumanAudit } from "../lib/audit";

/** Sample hash-chained rows so Audit is not empty on first demo open. */
export async function seedDemoAuditTrail(opts: {
  auroraStudioId: string;
  conorsCutId: string;
  founderUserId: string;
  ownerUserId: string;
  managerUserId?: string;
}): Promise<void> {
  const { auroraStudioId, conorsCutId, founderUserId, ownerUserId, managerUserId } = opts;

  await appendHumanAudit(auroraStudioId, founderUserId, "demo.world.provisioned", "business", auroraStudioId, {
    source: "POST /api/demo/provision",
    shops: ["aurora-studio", "aurora-mews", "aurora-galway", "conors-cut-co"],
  });

  await appendHumanAudit(auroraStudioId, founderUserId, "human.booking.create", "booking", "demo-booking-aurora-1", {
    customerName: "Mary McNamara",
    service: "Full Colour",
    status: "CONFIRMED",
    demo: true,
  });

  await appendHumanAudit(auroraStudioId, founderUserId, "human.conversation.reply", "conversation", "demo-conv-1", {
    channel: "sms",
    preview: "Thanks — see you Saturday at 10.",
    demo: true,
  });

  if (managerUserId) {
    await appendHumanAudit(auroraStudioId, managerUserId, "human.booking.update", "booking", "demo-booking-aurora-pending", {
      status: "PENDING",
      pendingReason: "awaiting_policy_review",
      demo: true,
    });
  }

  await appendHumanAudit(
    auroraStudioId,
    founderUserId,
    "human.persona.view",
    "membership",
    null,
    { persona: "staff", staffDisplayName: "Lara Byrne", demo: true },
  );

  await appendHumanAudit(auroraStudioId, founderUserId, "human.policy.operational.update", "business", auroraStudioId, {
    depositRequired: false,
    demo: true,
  });

  await appendHumanAudit(auroraStudioId, founderUserId, "human.liv.prompt.update", "business", auroraStudioId, {
    field: "greeting",
    demo: true,
  });

  await appendHumanAudit(conorsCutId, ownerUserId, "human.booking.create", "booking", "demo-booking-cork-1", {
    customerName: "Cian Walsh",
    service: "Skin Fade",
    status: "CONFIRMED",
    demo: true,
  });

  await appendHumanAudit(conorsCutId, ownerUserId, "human.business.update", "business", conorsCutId, {
    field: "timezone",
    value: "Europe/Dublin",
    demo: true,
  });
}
