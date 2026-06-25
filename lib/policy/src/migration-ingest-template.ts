/**
 * Livia Migration Ingest Template — standard entity bundle for partner / OAuth pulls.
 * External systems can map exports to this shape; Livia applies via one ingest path.
 */
import type { ImportEntityKind } from "./import-formats";

export const LIVIA_MIGRATION_TEMPLATE_VERSION = "1.0";

export type LiviaMigrationEntityBundle = {
  version: typeof LIVIA_MIGRATION_TEMPLATE_VERSION;
  /** ISO timestamp when export was generated */
  exportedAt?: string;
  /** External system business / salon identifier */
  externalBusinessId?: string;
  clients?: LiviaMigrationClient[];
  services?: LiviaMigrationService[];
  staff?: LiviaMigrationStaff[];
  appointments?: LiviaMigrationAppointment[];
  hours?: LiviaMigrationHoursRule[];
};

export type LiviaMigrationClient = {
  externalId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export type LiviaMigrationService = {
  externalId?: string;
  name: string;
  durationMinutes: number;
  priceMinor?: number;
  currency?: string;
};

export type LiviaMigrationStaff = {
  externalId?: string;
  displayName: string;
  email?: string;
};

export type LiviaMigrationAppointment = {
  externalId?: string;
  startAt: string;
  endAt?: string;
  clientExternalId?: string;
  serviceName?: string;
  staffName?: string;
  status?: "confirmed" | "cancelled" | "completed";
};

export type LiviaMigrationHoursRule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export const LIVIA_MIGRATION_BUNDLE_ENTITY_ORDER: ImportEntityKind[] = [
  "services",
  "staff",
  "clients",
  "appointments",
];

/** Required fields per entity for a valid partner handoff */
export const LIVIA_MIGRATION_TEMPLATE_REQUIREMENTS: Record<
  ImportEntityKind,
  { required: string[]; optional: string[] }
> = {
  clients: {
    required: ["firstName"],
    optional: ["lastName", "email", "phone", "externalId"],
  },
  services: {
    required: ["name", "durationMinutes"],
    optional: ["priceMinor", "currency", "externalId"],
  },
  staff: {
    required: ["displayName"],
    optional: ["email", "externalId"],
  },
  appointments: {
    required: ["startAt"],
    optional: ["endAt", "clientExternalId", "serviceName", "staffName", "status", "externalId"],
  },
};
