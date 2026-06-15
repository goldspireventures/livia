import type { Business } from "@workspace/db";
import type { LivSlot, LivToolDeps } from "@workspace/liv-runtime";
import { recordEvalTraceForTool } from "./eval-traces";
import { resolveGuestBookPath } from "./guest-public-urls";
import { createBookingViaLiv } from "../services/liv-booking.service";
import { getAvailableSlots } from "../services/slots.service";
import { sendStaffMessage } from "../services/conversations.service";
import {
  confirmBooking,
  cancelBookingWithReason,
  rescheduleBooking,
} from "../services/bookings.service";
import { lookupCustomersForLiv } from "../services/customers.service";
import { getMorningBriefing } from "../services/morning-briefing.service";
import { getBookingById } from "../services/bookings.service";
import { listStuckContinuityBookings } from "../services/booking-continuity.service";
import {
  draftDriftRecoveryMessage,
  listCustomerDriftCandidates,
} from "../services/customer-drift.service";
import { getBusinessActivationSnapshot } from "../services/activation-metrics.service";
import { getTenantCapabilities } from "../services/capability-resolution.service";
import {
  getBusinessTwinHealth,
  getBusinessTwinRecommendations,
  getBusinessTwinSummary,
} from "../services/business-twin.service";
import {
  formatCommerceMinor,
  getCommerceSnapshot,
} from "../services/commerce-intelligence.service";
import {
  getPresentationForBusiness,
  patchPresentationForBusiness,
} from "../services/presentation.service";
import { updateBusiness } from "../services/businesses.service";
import { logEvent } from "../services/events.service";
import {
  resolvePresentationPreset,
  type BusinessVertical,
} from "@workspace/policy";
import { getTenantExperienceForBusiness } from "../services/tenant-experience.service";
import {
  activationStepsFromState,
  BLOCKING_ONBOARDING_ACTS,
  buildSetupGuidedFlow,
  capabilityBlockerHref,
  isOnboardingAppUnlocked,
  nextRecommendedAct,
  onboardingStateSchema,
  explainOperationalPolicySummary,
  diffOperationalPolicy,
  mergeOperationalPolicy,
  parseOperationalPolicy,
  type OperationalPolicy,
} from "@workspace/policy";
import { policiesFromBusiness } from "../services/policies.service";
import { setAvailabilityRules } from "../services/availability.service";
import { applyOnboardingActCompletion } from "../services/onboarding-progress.service";
import { patchOperationalPolicy as applyOperationalPolicyPatch } from "../services/operational-policy.service";
import { createInvitation } from "../services/invitations.service";
import { getStaffById, setStaffServices } from "../services/staff.service";
import { getServiceById } from "../services/services.service";
import { getMessagingChannels } from "../services/messaging-channels.service";
import { isMetaConfigured } from "../services/ai-outbound.service";
import { EventType } from "@workspace/db";
import {
  getJurisdictionPack,
  guardChannelPackForProduction,
  resolveChannelPack,
} from "@workspace/policy";

function parseOperationalPolicyPartial(input: Record<string, unknown>): Partial<OperationalPolicy> {
  const partial: Partial<OperationalPolicy> = {};
  const parseBool = (v: unknown): boolean | undefined => {
    if (v === undefined || v === null || v === "") return undefined;
    const s = String(v).toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
    return undefined;
  };
  const parseIntField = (v: unknown): number | undefined => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : undefined;
  };
  if (input.depositRequired !== undefined) partial.depositRequired = parseBool(input.depositRequired);
  if (input.depositPercent !== undefined) partial.depositPercent = parseIntField(input.depositPercent);
  if (input.cancelWindowHours !== undefined) {
    partial.cancelWindowHours = parseIntField(input.cancelWindowHours);
  }
  if (input.bookingContinuityEnabled !== undefined) {
    partial.bookingContinuityEnabled = parseBool(input.bookingContinuityEnabled);
  }
  if (input.lateGraceMinutes !== undefined) {
    partial.lateGraceMinutes = parseIntField(input.lateGraceMinutes);
  }
  if (input.serviceBufferMinutes !== undefined) {
    partial.serviceBufferMinutes = parseIntField(input.serviceBufferMinutes);
  }
  if (input.autoConfirmWhenNoDeposit !== undefined) {
    partial.autoConfirmWhenNoDeposit = parseBool(input.autoConfirmWhenNoDeposit);
  }
  return partial;
}

export function buildLivToolDeps(args: {
  business: Business;
  conversationId: string;
  channelType: "WEB" | "SMS" | "WHATSAPP" | "INSTAGRAM" | "MESSENGER" | "VOICE";
  /** When set, send_message and staff booking tools are enabled. */
  staffAuthorUserId?: string;
}): LivToolDeps {
  const { business, conversationId, channelType, staffAuthorUserId } = args;
  const businessId = business.id;

  const base: LivToolDeps = {
    async findSlots(input) {
      const slots = await getAvailableSlots({
        businessId,
        serviceId: input.serviceId,
        date: input.date,
        staffId: input.staffId,
        timezone: business.timezone,
      });
      const available: LivSlot[] = slots
        .filter((s: { available: boolean }) => s.available)
        .map(
          (s: {
            startAt: string;
            endAt: string;
            staffId?: string | null;
            staffName?: string | null;
          }) => ({
            startAt: s.startAt,
            endAt: s.endAt,
            staffId: s.staffId ?? null,
            staffName: s.staffName ?? null,
          }),
        );

      await recordEvalTraceForTool({
        businessId,
        suite: "liv.book",
        scenario: "find_slots",
        toolName: "find_slots",
        toolInput: input,
        toolResult: { slotCount: available.length },
      });

      return available;
    },

    async searchRetailProducts(input) {
      const { tenantHasEntitlementForBusiness } = await import("../services/billing.service");
      const entitled = await tenantHasEntitlementForBusiness(businessId, "retail_pack");
      if (!entitled) {
        return { ok: false, error: "RETAIL_NOT_AVAILABLE", products: [] };
      }
      const { listActiveRetailProducts } = await import("../services/beauty-retail.service");
      const { isRetailProductInStock } = await import("@workspace/policy");
      const limit = Math.min(12, Math.max(1, Math.floor(input.limit ?? 6)));
      const q = input.query?.trim().toLowerCase();
      const cat = input.category?.trim().toLowerCase();
      let products = await listActiveRetailProducts(businessId);
      products = products.filter((p) => isRetailProductInStock(p.stockQuantity));
      if (q) {
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q) ||
            (p.category ?? "").toLowerCase().includes(q),
        );
      }
      if (cat) {
        products = products.filter((p) => (p.category ?? "").toLowerCase() === cat);
      }
      return {
        ok: true,
        products: products.slice(0, limit).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          priceMinor: p.priceMinor,
          currency: p.currency,
          inStock: true,
        })),
      };
    },

    async createBooking(input) {
      return createBookingViaLiv({
        businessId,
        conversationId,
        channelType,
        serviceId: input.serviceId,
        startAt: input.startAt,
        staffId: input.staffId,
        customerFirstName: input.customerFirstName,
        customerLastName: input.customerLastName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        notes: input.notes,
      });
    },
  };

  if (!staffAuthorUserId) return base;

  return {
    ...base,
    async sendMessage(input) {
      const row = await sendStaffMessage({
        businessId,
        conversationId,
        authorUserId: staffAuthorUserId,
        content: input.content,
      });
      return { messageId: row.id };
    },
    async confirmBooking(input) {
      const row = await confirmBooking(businessId, input.bookingId);
      if (!row) throw new Error("BOOKING_NOT_FOUND");
      return { bookingId: row.id, status: row.status };
    },
    async cancelBooking(input) {
      const row = await cancelBookingWithReason(businessId, input.bookingId, input.reason);
      if (!row) throw new Error("BOOKING_NOT_FOUND");
      return { bookingId: row.id, status: row.status };
    },
    async rescheduleBooking(input) {
      const row = await rescheduleBooking(businessId, input.bookingId, input.startAt);
      return { bookingId: row.id, startAt: row.startAt, endAt: row.endAt };
    },
    async lookupCustomer(input) {
      const res = await lookupCustomersForLiv(businessId, input.query.trim(), 8);
      return {
        customers: res.data.map((c) => ({
          id: c.id,
          displayName: c.displayName,
          email: c.email,
          phone: c.phone,
          trustedClient: c.trustedClient,
          strikeCount: c.strikeCount,
        })),
        total: res.total,
      };
    },
    async morningBriefing() {
      const b = await getMorningBriefing(businessId);
      return { briefing: b };
    },
    async getBooking(input) {
      const row = await getBookingById(businessId, input.bookingId);
      if (!row) return { ok: false, error: "NOT_FOUND" };
      return {
        ok: true,
        booking: {
          id: row.id,
          status: row.status,
          pendingReason: row.pendingReason,
          startAt: row.startAt,
          endAt: row.endAt,
          customerName: row.customer?.displayName ?? null,
          serviceName: row.service?.name ?? null,
          staffName: row.staff?.displayName ?? null,
        },
      };
    },
    async listStuckContinuity(input) {
      const rows = await listStuckContinuityBookings(businessId);
      const limit = input.limit ?? 10;
      return {
        stuck: rows.slice(0, limit).map((r) => ({
          bookingId: r.bookingId,
          customerName: r.customerName,
          serviceName: r.serviceName,
          startAt: r.startAt,
        })),
        total: rows.length,
      };
    },
    async listDriftCandidates(input) {
      const rows = await listCustomerDriftCandidates(businessId, {
        minDays: input.minDays,
        limit: input.limit,
      });
      return {
        candidates: rows.map((r) => ({
          customerId: r.customerId,
          customerName: r.customerName,
          lastServiceName: r.lastServiceName,
          lastVisitAt: r.lastVisitAt,
          daysSinceVisit: r.daysSinceVisit,
        })),
        total: rows.length,
      };
    },
    async draftDriftRecovery(input) {
      const message = draftDriftRecoveryMessage({
        businessName: business.name,
        customerName: input.customerName ?? "there",
        lastServiceName: input.lastServiceName,
        daysSinceVisit: input.daysSinceVisit ?? 90,
      });
      return {
        message,
        customerId: input.customerId ?? null,
        note: "Review and send via send_message or inbox — owner approval required.",
      };
    },
    async wellnessEodClose() {
      const { getEodCloseNarrative } = await import("../services/wellness-ops.service");
      return getEodCloseNarrative(businessId);
    },
    async wellnessDutySolver(input) {
      const { proposeDutySolver } = await import("../services/wellness-ops.service");
      return proposeDutySolver(businessId, {
        resourceName: input.resourceName,
        hour: input.hour,
        therapistGender: "any",
      });
    },
    async wellnessReroom() {
      const { proposeRerooming } = await import("../services/wellness-ops.service");
      return proposeRerooming(businessId);
    },
    async getActivationStatus() {
      const activation = await getBusinessActivationSnapshot(businessId);
      return { activation };
    },
    async getBusinessTwin() {
      const [summary, health, recommendations] = await Promise.all([
        getBusinessTwinSummary(businessId),
        getBusinessTwinHealth(businessId),
        getBusinessTwinRecommendations(businessId),
      ]);
      return {
        summary,
        overallScore: health?.overallScore ?? null,
        domains: health?.domains ?? [],
        recommendations: recommendations?.recommendations?.slice(0, 6) ?? [],
      };
    },
    async getCommerceSnapshot() {
      const snapshot = await getCommerceSnapshot(businessId);
      return {
        snapshot,
        capturedLabel: formatCommerceMinor(snapshot.capturedMinor30d, snapshot.currency),
      };
    },
    async getCommerceSignals() {
      const { getCommerceSignalsBundle } = await import("../services/commerce-signals.service");
      return getCommerceSignalsBundle(businessId);
    },
    async listCapabilityBlockers() {
      const caps = await getTenantCapabilities(businessId);
      if (!caps) return { ok: false, error: "NOT_FOUND" };
      return {
        capabilityHealth: caps.capabilityHealth,
        blockers: caps.platformCapabilities.flatMap((cap) =>
          cap.readinessBlockers.map((blocker) => ({
            capabilityId: cap.id,
            capabilityName: cap.name,
            blocker,
            href: capabilityBlockerHref(cap.id, blocker),
          })),
        ),
        onboardingAutoAdvanced: caps.onboardingAutoAdvanced ?? [],
      };
    },
    async getOwnerIntelligence() {
      const { getOwnerIntelligenceBundleCached } = await import(
        "../services/owner-intelligence-cache"
      );
      const bundle = await getOwnerIntelligenceBundleCached(businessId);
      return bundle ?? { ok: false, error: "NOT_FOUND" };
    },
    async listPresentationPresets() {
      const options = await getPresentationForBusiness(businessId);
      if (!options) return { ok: false, error: "NOT_FOUND" };
      return {
        vertical: options.vertical,
        currentPresetId: options.presetId,
        presets: options.availablePresets.map((p) => ({
          id: p.id,
          label: p.label,
          description: p.description,
        })),
      };
    },
    async getSetupChecklist() {
      const parsed = onboardingStateSchema.safeParse(business.onboardingState);
      const state = parsed.success ? parsed.data : null;
      const blockingActs = BLOCKING_ONBOARDING_ACTS.map((actId) => ({
        actId,
        done: (state?.completedActs ?? []).includes(actId),
      }));
      const [activation, capabilities] = await Promise.all([
        getBusinessActivationSnapshot(businessId),
        getTenantCapabilities(businessId),
      ]);
      const sacredMetricMet = activation?.sacredMetricMet ?? false;
      const guidedFlow = buildSetupGuidedFlow({
        onboardingState: state,
        vertical: business.vertical,
        slug: business.slug,
        sacredMetricMet,
      });
      const capabilityBlockers =
        capabilities?.platformCapabilities.flatMap((cap) =>
          cap.readinessBlockers.map((blocker) => ({
            capabilityId: cap.id,
            capabilityName: cap.name,
            blocker,
          })),
        ) ?? [];
      return {
        percentComplete: state?.percentComplete ?? 0,
        appUnlocked: isOnboardingAppUnlocked(state),
        nextAct: state ? nextRecommendedAct(state) : "a2_shop_profile",
        blockingActs,
        activationSteps: activationStepsFromState(state, business.vertical),
        currentPhaseId: guidedFlow.currentPhaseId,
        capabilityBlockers,
      };
    },
    async getTenantExperience() {
      const experience = await getTenantExperienceForBusiness(businessId);
      if (!experience) return { ok: false, error: "NOT_FOUND" };
      return experience;
    },
    async previewPresentation(input) {
      const current = await getPresentationForBusiness(businessId);
      if (!current) return { ok: false, error: "NOT_FOUND" };
      try {
        const preset = resolvePresentationPreset(
          current.vertical as BusinessVertical,
          input.presentationPresetId,
        );
        const accent = input.brandAccentHex?.trim();
        const presetQs = `preview=1&preset=${encodeURIComponent(preset.cssPreset)}`;
        const accentQs = accent ? `&accent=${encodeURIComponent(accent)}` : "";
        return {
          ok: true,
          presetId: preset.id,
          label: preset.label,
          cssPreset: preset.cssPreset,
          currentPresetId: current.presetId,
          dashboardPreviewPath: `/dashboard?appearanceEmbed=1&${presetQs}${accentQs}`,
          publicPreviewUrl: business.slug ? resolveGuestBookPath(business.slug) : null,
          note: "Show preview to owner, then call apply_presentation_preset with confirm: true.",
        };
      } catch {
        return { ok: false, error: "INVALID_PRESET" };
      }
    },
    async applyPresentationPreset(input) {
      if (!input.confirm) {
        return {
          ok: false,
          error: "CONFIRM_REQUIRED",
          message: "Owner must confirm after preview — pass confirm: true.",
        };
      }
      try {
        const payload = await patchPresentationForBusiness(businessId, {
          presentationPresetId: input.presentationPresetId,
          brandAccentHex: input.brandAccentHex ?? undefined,
        });
        if (!payload) return { ok: false, error: "NOT_FOUND" };
        await logEvent({
          type: "PRESENTATION_PRESET_CHANGED",
          businessId,
          entityType: "business",
          entityId: businessId,
          context: { presetId: payload.presetId, source: "liv_setup_copilot" },
        });
        return { ok: true, presetId: payload.presetId, label: payload.preset.label };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "FAILED";
        if (msg === "INVALID_PRESET") return { ok: false, error: "INVALID_PRESET" };
        if (msg === "PRESENTATION_PRESETS_DISABLED") {
          return { ok: false, error: "PRESETS_DISABLED" };
        }
        return { ok: false, error: msg };
      }
    },
    async patchLivPersona(input) {
      if (!input.confirm) {
        return {
          ok: false,
          error: "CONFIRM_REQUIRED",
          message: "Pass confirm: true before patching Liv persona.",
        };
      }
      const patch: Record<string, unknown> = {};
      if (input.aiTone !== undefined) patch.aiTone = input.aiTone;
      if (input.aiGreeting !== undefined) patch.aiGreeting = input.aiGreeting;
      if (input.aiKnowledge !== undefined) patch.aiKnowledge = input.aiKnowledge;
      if (input.aiEnabled !== undefined) patch.aiEnabled = input.aiEnabled ? "true" : "false";
      if (input.aiCanBookDirectly !== undefined) {
        patch.aiCanBookDirectly = input.aiCanBookDirectly ? "true" : "false";
      }
      if (Object.keys(patch).length === 0) {
        return { ok: false, error: "EMPTY_PATCH" };
      }
      const updated = await updateBusiness(businessId, patch);
      if (!updated) return { ok: false, error: "NOT_FOUND" };
      await logEvent({
        type: "BUSINESS_UPDATED",
        businessId,
        entityType: "business",
        entityId: businessId,
        context: { fields: Object.keys(patch), source: "liv_setup_copilot" },
      });
      return {
        ok: true,
        aiTone: updated.aiTone,
        aiGreeting: updated.aiGreeting,
        aiEnabled: updated.aiEnabled,
        aiCanBookDirectly: updated.aiCanBookDirectly,
      };
    },
    async patchBrandAssets(input) {
      if (!input.confirm) {
        return {
          ok: false,
          error: "CONFIRM_REQUIRED",
          message: "Pass confirm: true before patching brand assets.",
        };
      }
      const patch: Record<string, unknown> = {};
      if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl || null;
      if (input.coverImageUrl !== undefined) patch.coverImageUrl = input.coverImageUrl || null;
      if (input.brandAccentHex !== undefined) {
        if (
          input.brandAccentHex !== null &&
          input.brandAccentHex !== "" &&
          !/^#[0-9A-Fa-f]{6}$/.test(input.brandAccentHex)
        ) {
          return { ok: false, error: "INVALID_ACCENT_HEX" };
        }
        patch.brandAccentHex = input.brandAccentHex || null;
      }
      if (Object.keys(patch).length === 0) {
        return { ok: false, error: "EMPTY_PATCH" };
      }
      const updated = await updateBusiness(businessId, patch);
      if (!updated) return { ok: false, error: "NOT_FOUND" };
      await logEvent({
        type: "BUSINESS_UPDATED",
        businessId,
        entityType: "business",
        entityId: businessId,
        context: { fields: Object.keys(patch), source: "liv_setup_copilot" },
      });
      return {
        ok: true,
        logoUrl: updated.logoUrl,
        coverImageUrl: updated.coverImageUrl,
        brandAccentHex: updated.brandAccentHex,
      };
    },
    async explainOperationalPolicy() {
      const policies = policiesFromBusiness(business);
      const summary = explainOperationalPolicySummary({
        operational: policies.operational,
        cancelWindowHours: policies.operational.cancelWindowHours,
        depositPolicySummary: policies.depositPolicySummary,
      });
      return { policy: policies.operational, ...summary };
    },
    async proposePolicyPatch(input) {
      const current = parseOperationalPolicy(business.operationalPolicy);
      const partial = parseOperationalPolicyPartial(input);
      if (Object.keys(partial).length === 0) {
        return { ok: false, error: "EMPTY_PROPOSAL" };
      }
      const proposed = mergeOperationalPolicy(partial, current);
      const changes = diffOperationalPolicy(current, proposed);
      return {
        ok: true,
        current,
        proposed,
        changes,
        note: "Read-only proposal — call patch_operational_policy with the same fields and confirm: true to apply.",
      };
    },
    async patchBusinessHours(input) {
      if (!input.confirm) {
        return {
          ok: false,
          error: "CONFIRM_REQUIRED",
          message: "Pass confirm: true before updating opening hours.",
        };
      }
      if (!input.rules.length) {
        return { ok: false, error: "EMPTY_RULES" };
      }
      for (const r of input.rules) {
        if (
          !Number.isInteger(r.dayOfWeek) ||
          r.dayOfWeek < 0 ||
          r.dayOfWeek > 6 ||
          !/^\d{2}:\d{2}$/.test(r.startTime) ||
          !/^\d{2}:\d{2}$/.test(r.endTime)
        ) {
          return { ok: false, error: "INVALID_RULE", rule: r };
        }
      }
      const updated = await setAvailabilityRules(businessId, input.rules, input.staffId);
      await logEvent({
        type: EventType.AVAILABILITY_UPDATED,
        businessId,
        entityType: "business",
        entityId: businessId,
        context: { source: "liv_setup_copilot", ruleCount: updated.length },
      });
      const onboarding = await applyOnboardingActCompletion({
        businessId,
        act: "a5_hours",
        checklist: { hoursConfirmed: true },
      });
      return {
        ok: true,
        ruleCount: updated.length,
        rules: updated.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
        onboardingAct: onboarding.ok ? "a5_hours" : undefined,
      };
    },
    async confirmPublicLink(input) {
      if (!input.confirm) {
        return {
          ok: false,
          error: "CONFIRM_REQUIRED",
          message: "Pass confirm: true after owner confirms their public booking link.",
        };
      }
      if (!business.slug) {
        return { ok: false, error: "NO_SLUG" };
      }
      const onboarding = await applyOnboardingActCompletion({
        businessId,
        act: "a8_public_link",
        checklist: { publicLinkShared: true },
      });
      if (!onboarding.ok) {
        return { ok: false, error: onboarding.error, message: onboarding.message };
      }
      return {
        ok: true,
        publicPath: resolveGuestBookPath(business.slug),
        slug: business.slug,
        onboardingAct: "a8_public_link",
        percentComplete: onboarding.state.percentComplete,
      };
    },
    async patchOperationalPolicy(input) {
      if (!input.confirm) {
        return {
          ok: false,
          error: "CONFIRM_REQUIRED",
          message: "Pass confirm: true after owner approves the proposed policy patch.",
        };
      }
      const partial = parseOperationalPolicyPartial(input.partial);
      if (Object.keys(partial).length === 0) {
        return { ok: false, error: "EMPTY_PATCH" };
      }
      const current = parseOperationalPolicy(business.operationalPolicy);
      const payload = await applyOperationalPolicyPatch(businessId, partial);
      if (!payload) return { ok: false, error: "NOT_FOUND" };
      const changes = diffOperationalPolicy(current, payload.policy);
      await logEvent({
        type: "BUSINESS_UPDATED",
        businessId,
        entityType: "business",
        entityId: businessId,
        context: {
          source: "liv_setup_copilot",
          fields: changes.map((c) => c.field),
          policyPatch: true,
        },
      });
      return { ok: true, policy: payload.policy, changes, depositPolicySummary: payload.depositPolicySummary };
    },
    async inviteStaff(input) {
      if (!input.confirm) {
        return {
          ok: false,
          error: "CONFIRM_REQUIRED",
          message: "Pass confirm: true before sending a team invitation.",
        };
      }
      if (!staffAuthorUserId) {
        return { ok: false, error: "STAFF_USER_REQUIRED" };
      }
      const email = input.email.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "INVALID_EMAIL" };
      }
      try {
        const inv = await createInvitation({
          businessId,
          businessName: business.name,
          email,
          role: input.role,
          deskRole: input.deskRole,
          inviterUserId: staffAuthorUserId,
        });
        await logEvent({
          type: "BUSINESS_UPDATED",
          businessId,
          userId: staffAuthorUserId,
          entityType: "invitation",
          entityId: inv.id,
          context: { email, role: input.role, source: "liv_setup_copilot" },
        });
        const onboarding = await applyOnboardingActCompletion({
          businessId,
          userId: staffAuthorUserId,
          act: "a10_invite_team",
          checklist: { teamInvited: true },
        });
        return {
          ok: true,
          invitationId: inv.id,
          email: inv.emailAddress,
          status: inv.status,
          onboardingAct: onboarding.ok ? "a10_invite_team" : undefined,
        };
      } catch (err) {
        const e = err as Error & { code?: string };
        if (e.code === "CLERK_NOT_CONFIGURED") {
          return { ok: false, error: "CLERK_NOT_CONFIGURED", message: e.message };
        }
        return { ok: false, error: "INVITATION_FAILED", message: e.message };
      }
    },
    async assignService(input) {
      if (!input.confirm) {
        return {
          ok: false,
          error: "CONFIRM_REQUIRED",
          message: "Pass confirm: true before assigning services to staff.",
        };
      }
      const staff = await getStaffById(businessId, input.staffId);
      if (!staff) return { ok: false, error: "STAFF_NOT_FOUND" };
      for (const serviceId of input.serviceIds) {
        const svc = await getServiceById(businessId, serviceId);
        if (!svc) return { ok: false, error: "SERVICE_NOT_FOUND", serviceId };
      }
      await setStaffServices(input.staffId, input.serviceIds);
      await logEvent({
        type: "STAFF_UPDATED",
        businessId,
        entityType: "staff",
        entityId: input.staffId,
        context: {
          source: "liv_setup_copilot",
          serviceIds: input.serviceIds,
        },
      });
      return {
        ok: true,
        staffId: input.staffId,
        staffName: staff.displayName,
        serviceIds: input.serviceIds,
      };
    },
    async startChannelConnect(input) {
      const focus = (input.channel ?? "all").toLowerCase();
      const jurisdiction = getJurisdictionPack(business.country);
      const channelPack = guardChannelPackForProduction(resolveChannelPack(jurisdiction.code));
      const messaging = await getMessagingChannels(businessId);
      const publicBase = process.env["PUBLIC_BASE_URL"]?.replace(/\/+$/, "") ?? null;
      const smsReady = Boolean(business.twilioPhoneNumber);
      const waReady = Boolean(messaging.whatsapp?.phoneNumberId);
      const igReady = Boolean(messaging.instagram?.pageId);
      const metaReady = isMetaConfigured() || process.env["META_DEV_SIMULATE"] === "true";

      const steps: string[] = [];
      if (focus === "all" || focus === "sms") {
        steps.push(
          smsReady
            ? `SMS number provisioned (${business.twilioPhoneNumber}).`
            : "Provision an SMS number in Settings → Communications.",
        );
      }
      if (focus === "all" || focus === "whatsapp" || focus === "instagram") {
        steps.push(
          metaReady
            ? "Meta integration is available — connect WhatsApp/Instagram in Settings → Communications."
            : "Meta is not configured in this environment; use SMS or web booking for now.",
        );
        if (waReady) steps.push("WhatsApp channel IDs are saved.");
        if (igReady) steps.push("Instagram page is linked.");
      }

      return {
        ok: true,
        settingsPath: "/settings?tab=comms",
        handoff: true,
        note: "Open Settings → Communications to complete OAuth and webhook steps. Liv does not store channel tokens in chat.",
        jurisdiction: jurisdiction.code,
        channelPack,
        status: {
          sms: smsReady,
          whatsapp: waReady,
          instagram: igReady,
          metaConfigured: metaReady,
        },
        metaWebhookUrl: publicBase ? `${publicBase}/api/channels/meta` : null,
        steps,
      };
    },
  };
}
