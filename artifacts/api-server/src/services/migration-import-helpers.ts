import { and, eq } from "drizzle-orm";
import { db, customersTable, servicesTable, staffTable } from "@workspace/db";
import { createCustomer } from "./customers.service";
import { createService } from "./services.service";
import { createStaff } from "./staff.service";

export async function findCustomerByEmailOrPhone(
  businessId: string,
  email?: string,
  phone?: string,
) {
  if (email) {
    const [c] = await db
      .select()
      .from(customersTable)
      .where(and(eq(customersTable.businessId, businessId), eq(customersTable.email, email)))
      .limit(1);
    if (c) return c;
  }
  if (phone) {
    const [c] = await db
      .select()
      .from(customersTable)
      .where(and(eq(customersTable.businessId, businessId), eq(customersTable.phone, phone)))
      .limit(1);
    if (c) return c;
  }
  return null;
}

export async function findServiceByName(businessId: string, name: string) {
  const services = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.businessId, businessId));
  const lower = name.toLowerCase();
  return services.find((s) => s.name.toLowerCase() === lower) ?? null;
}

export async function findStaffByName(businessId: string, name: string) {
  const staff = await db
    .select()
    .from(staffTable)
    .where(and(eq(staffTable.businessId, businessId), eq(staffTable.isActive, true)));
  const lower = name.toLowerCase();
  return (
    staff.find(
      (s) =>
        s.displayName.toLowerCase() === lower ||
        `${s.firstName} ${s.lastName ?? ""}`.trim().toLowerCase() === lower,
    ) ?? null
  );
}

export async function ensureCustomer(
  businessId: string,
  args: { firstName: string; lastName?: string; email?: string; phone?: string },
) {
  const existing = await findCustomerByEmailOrPhone(businessId, args.email, args.phone);
  if (existing) return existing;
  return createCustomer(businessId, {
    firstName: args.firstName,
    lastName: args.lastName,
    email: args.email,
    phone: args.phone,
  });
}

export async function ensureService(
  businessId: string,
  args: { name: string; durationMinutes?: number; priceMinor?: number; category?: string },
) {
  const existing = await findServiceByName(businessId, args.name);
  if (existing) return existing;
  return createService(businessId, {
    name: args.name,
    durationMinutes: args.durationMinutes ?? 60,
    priceMinor: args.priceMinor ?? 0,
    category: args.category ?? "Imported",
  });
}

export async function ensureStaffMember(
  businessId: string,
  args: { displayName: string; firstName?: string; lastName?: string; email?: string },
) {
  const existing = await findStaffByName(businessId, args.displayName);
  if (existing) return existing;
  const parts = args.displayName.trim().split(/\s+/);
  return createStaff(businessId, {
    firstName: args.firstName ?? parts[0] ?? "Team",
    lastName: args.lastName ?? (parts.slice(1).join(" ") || undefined),
    displayName: args.displayName,
    email: args.email,
    color: "#6366f1",
  });
}

export function splitPersonName(full?: string | null): { firstName: string; lastName?: string } {
  const trimmed = (full ?? "").trim();
  if (!trimmed) return { firstName: "Imported" };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? "Imported",
    lastName: parts.slice(1).join(" ") || undefined,
  };
}

export function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
