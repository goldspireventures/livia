import { db, customersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { guestBookTokenPath } from "@workspace/policy";
import { verticalRequiresIntake } from "@workspace/policy";
import { upsertMedicalIntake } from "./medspa.service";
import { ensureMedicalIntakeGuestAccess } from "./medical-intake-guest-access.service";
import { getBusinessById } from "./businesses.service";
import { sendDirectWhatsapp } from "./ai-outbound.service";
import { getMessagingChannels } from "./messaging-channels.service";

export type IntakeLinkResult = {
  intakeId: string;
  token: string;
  relativePath: string;
};

export function buildIntakeGuestPath(slug: string, token: string): string {
  return guestBookTokenPath(slug, "intake", token);
}

export async function ensureIntakeForBooking(args: {
  businessId: string;
  customerId: string;
  bookingId: string;
  vertical?: string | null;
}): Promise<IntakeLinkResult | null> {
  const biz = await getBusinessById(args.businessId);
  const vertical = args.vertical ?? biz?.vertical ?? null;
  if (!verticalRequiresIntake(vertical)) return null;

  const row = await upsertMedicalIntake({
    businessId: args.businessId,
    customerId: args.customerId,
    bookingId: args.bookingId,
    submit: false,
  });
  const token = await ensureMedicalIntakeGuestAccess(args.businessId, row.id);
  return {
    intakeId: row.id,
    token,
    relativePath: buildIntakeGuestPath(biz?.slug ?? "", token),
  };
}

export async function sendIntakeLinkViaWhatsApp(args: {
  businessId: string;
  customerPhone: string;
  slug: string;
  token: string;
  businessName: string;
}): Promise<boolean> {
  const ch = await getMessagingChannels(args.businessId);
  const phoneNumberId = ch.whatsapp?.phoneNumberId;
  if (!phoneNumberId) return false;

  const path = buildIntakeGuestPath(args.slug, args.token);
  const origin = process.env.DASHBOARD_PUBLIC_URL ?? process.env.APP_ORIGIN ?? "https://app.livia-hq.com";
  const url = `${origin.replace(/\/$/, "")}${path}`;

  const body = `Thanks for booking with ${args.businessName}. Complete your pre-visit intake here (2 min): ${url}`;
  const sent = await sendDirectWhatsapp({
    phoneNumberId,
    to: args.customerPhone.replace(/\D/g, ""),
    body,
  }).catch(() => null);
  return !!sent;
}

export async function followUpIntakeAfterBooking(args: {
  businessId: string;
  customerId: string;
  bookingId: string;
  customerPhone?: string | null;
  channelType?: string | null;
}): Promise<IntakeLinkResult | null> {
  const link = await ensureIntakeForBooking({
    businessId: args.businessId,
    customerId: args.customerId,
    bookingId: args.bookingId,
  });
  if (!link) return null;

  const biz = await getBusinessById(args.businessId);

  let phone = args.customerPhone ?? null;
  if (!phone) {
    const [cust] = await db
      .select({ phone: customersTable.phone })
      .from(customersTable)
      .where(eq(customersTable.id, args.customerId))
      .limit(1);
    phone = cust?.phone ?? null;
  }

  if (
    args.channelType === "WHATSAPP" &&
    phone &&
    biz?.slug
  ) {
    void sendIntakeLinkViaWhatsApp({
      businessId: args.businessId,
      customerPhone: phone,
      slug: biz.slug,
      token: link.token,
      businessName: biz.name,
    });
  }
  return link;
}
