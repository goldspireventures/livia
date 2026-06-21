/**
 * Universal CSV import — format detection and column mapping.
 * Owner-facing copy stays generic; no third-party product names.
 */

export type ImportEntityKind = "clients" | "services" | "appointments" | "staff";

export type DetectedImportFormat = {
  kind: ImportEntityKind;
  /** Confidence 0–1 */
  confidence: number;
  columnMap: Record<string, string>;
  headerRow: string[];
};

export type ParsedImportRow = Record<string, string>;

const NORMALIZE = (h: string) =>
  h
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/** Parse CSV text into rows (handles quoted fields). */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field.trim());
      field = "";
      continue;
    }
    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(field.trim());
      field = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      if (ch === "\r") i++;
      continue;
    }
    if (ch === "\r") continue;
    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}

function rowsToObjects(rows: string[][]): { headers: string[]; records: ParsedImportRow[] } {
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0]!.map((h) => h.trim());
  const records: ParsedImportRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]!;
    const obj: ParsedImportRow = {};
    let hasValue = false;
    for (let j = 0; j < headers.length; j++) {
      const val = (cells[j] ?? "").trim();
      if (val) hasValue = true;
      obj[headers[j]!] = val;
    }
    if (hasValue) records.push(obj);
  }
  return { headers, records };
}

const CLIENT_ALIASES: Record<string, string[]> = {
  firstName: ["first_name", "firstname", "first", "given_name", "client_first_name", "customer_first_name"],
  lastName: ["last_name", "lastname", "last", "surname", "client_last_name", "customer_last_name"],
  email: ["email", "email_address", "e_mail", "client_email"],
  phone: ["phone", "phone_number", "mobile", "cell", "telephone", "client_phone"],
  notes: ["notes", "note", "comments", "client_notes"],
};

const SERVICE_ALIASES: Record<string, string[]> = {
  name: ["name", "service", "service_name", "appointment_type", "appointment_type_name", "treatment", "title"],
  durationMinutes: [
    "duration",
    "duration_minutes",
    "duration_mins",
    "minutes",
    "length",
    "time",
  ],
  priceMinor: ["price", "amount", "cost", "fee", "price_minor", "service_price"],
  category: ["category", "type", "group", "service_category"],
  description: ["description", "desc", "details"],
};

const APPOINTMENT_ALIASES: Record<string, string[]> = {
  date: ["date", "appointment_date", "start_date", "day"],
  time: ["time", "start_time", "appointment_time", "start"],
  serviceName: ["service", "service_name", "appointment_type", "appointment_type_name", "type"],
  firstName: ["first_name", "firstname", "client_first_name", "customer_first_name"],
  lastName: ["last_name", "lastname", "client_last_name", "customer_last_name"],
  email: ["email", "client_email"],
  phone: ["phone", "client_phone"],
  staffName: ["staff", "staff_member", "provider", "calendar", "employee", "practitioner"],
  status: ["status", "appointment_status"],
};

const STAFF_ALIASES: Record<string, string[]> = {
  firstName: ["first_name", "firstname", "name", "staff_name", "employee_name"],
  lastName: ["last_name", "lastname", "surname"],
  email: ["email", "staff_email"],
  displayName: ["display_name", "full_name", "calendar_name"],
};

function matchColumns(
  headers: string[],
  aliases: Record<string, string[]>,
): { map: Record<string, string>; score: number; total: number } {
  const normalized = headers.map((h) => ({ raw: h, norm: NORMALIZE(h) }));
  const map: Record<string, string> = {};
  let score = 0;
  const total = Object.keys(aliases).length;

  for (const [canonical, variants] of Object.entries(aliases)) {
    const hit = normalized.find(({ norm, raw }) => {
      if (variants.includes(norm)) return true;
      if (norm === NORMALIZE(canonical)) return true;
      return variants.some((v) => norm.includes(v) || v.includes(norm));
    });
    if (hit) {
      map[canonical] = hit.raw;
      score++;
    }
  }

  return { map, score, total };
}

function pickField(row: ParsedImportRow, columnMap: Record<string, string>, key: string): string {
  const col = columnMap[key];
  if (!col) return "";
  return (row[col] ?? "").trim();
}

export function detectImportFormat(headers: string[]): DetectedImportFormat | null {
  if (headers.length === 0) return null;

  const candidates: DetectedImportFormat[] = [];

  for (const kind of ["clients", "services", "appointments", "staff"] as ImportEntityKind[]) {
    const aliases =
      kind === "clients"
        ? CLIENT_ALIASES
        : kind === "services"
          ? SERVICE_ALIASES
          : kind === "appointments"
            ? APPOINTMENT_ALIASES
            : STAFF_ALIASES;
    const { map, score, total } = matchColumns(headers, aliases);
    const required =
      kind === "clients"
        ? score >= 1 && (map.firstName || map.email || map.phone)
        : kind === "services"
          ? score >= 1 && map.name
          : kind === "appointments"
            ? score >= 2 && (map.date || map.serviceName)
            : score >= 1 && (map.firstName || map.displayName || map.email);
    if (!required) continue;
    candidates.push({
      kind,
      confidence: score / total,
      columnMap: map,
      headerRow: headers,
    });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates[0] ?? null;
}

export function parseCsvImport(csvText: string): {
  format: DetectedImportFormat | null;
  records: ParsedImportRow[];
  headers: string[];
} {
  const rows = parseCsvRows(csvText.trim());
  if (rows.length === 0) return { format: null, records: [], headers: [] };

  const { headers, records } = rowsToObjects(rows);
  const format = detectImportFormat(headers);
  return { format, records, headers };
}

export type NormalizedClientRow = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type NormalizedServiceRow = {
  name: string;
  durationMinutes: number;
  priceMinor: number;
  category?: string;
  description?: string;
};

export type NormalizedAppointmentRow = {
  date: string;
  time?: string;
  serviceName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  staffName?: string;
  status?: string;
};

export type NormalizedStaffRow = {
  firstName: string;
  lastName?: string;
  email?: string;
  displayName?: string;
};

function parseDurationMinutes(raw: string): number {
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  if (Number.isFinite(n) && n > 0) return n;
  return 60;
}

function parsePriceMinor(raw: string): number {
  const cleaned = raw.replace(/[€$£,\s]/g, "");
  const f = parseFloat(cleaned);
  if (!Number.isFinite(f)) return 0;
  return Math.round(f * 100);
}

export function normalizeClientRow(
  row: ParsedImportRow,
  columnMap: Record<string, string>,
): NormalizedClientRow | null {
  const firstName = pickField(row, columnMap, "firstName");
  const email = pickField(row, columnMap, "email");
  const phone = pickField(row, columnMap, "phone");
  if (!firstName && !email && !phone) return null;

  const nameParts = firstName.includes(" ") ? firstName.split(/\s+/) : [firstName];
  return {
    firstName: nameParts[0] || email?.split("@")[0] || phone || "Client",
    lastName: pickField(row, columnMap, "lastName") || nameParts.slice(1).join(" ") || undefined,
    email: email || undefined,
    phone: phone || undefined,
    notes: pickField(row, columnMap, "notes") || undefined,
  };
}

export function normalizeServiceRow(
  row: ParsedImportRow,
  columnMap: Record<string, string>,
): NormalizedServiceRow | null {
  const name = pickField(row, columnMap, "name");
  if (!name) return null;
  return {
    name,
    durationMinutes: parseDurationMinutes(pickField(row, columnMap, "durationMinutes") || "60"),
    priceMinor: parsePriceMinor(pickField(row, columnMap, "priceMinor")),
    category: pickField(row, columnMap, "category") || undefined,
    description: pickField(row, columnMap, "description") || undefined,
  };
}

export function normalizeAppointmentRow(
  row: ParsedImportRow,
  columnMap: Record<string, string>,
): NormalizedAppointmentRow | null {
  const serviceName = pickField(row, columnMap, "serviceName");
  const date = pickField(row, columnMap, "date");
  if (!serviceName && !date) return null;
  return {
    date,
    time: pickField(row, columnMap, "time") || undefined,
    serviceName: serviceName || "Imported appointment",
    firstName: pickField(row, columnMap, "firstName") || undefined,
    lastName: pickField(row, columnMap, "lastName") || undefined,
    email: pickField(row, columnMap, "email") || undefined,
    phone: pickField(row, columnMap, "phone") || undefined,
    staffName: pickField(row, columnMap, "staffName") || undefined,
    status: pickField(row, columnMap, "status") || undefined,
  };
}

export function normalizeStaffRow(
  row: ParsedImportRow,
  columnMap: Record<string, string>,
): NormalizedStaffRow | null {
  const displayName = pickField(row, columnMap, "displayName");
  const firstName = pickField(row, columnMap, "firstName") || displayName;
  if (!firstName) return null;
  const parts = firstName.split(/\s+/);
  return {
    firstName: parts[0]!,
    lastName: pickField(row, columnMap, "lastName") || parts.slice(1).join(" ") || undefined,
    email: pickField(row, columnMap, "email") || undefined,
    displayName: displayName || undefined,
  };
}

/** Owner-facing import kind labels — generic only. */
export const IMPORT_KIND_LABELS: Record<ImportEntityKind, string> = {
  clients: "Client list",
  services: "Service menu",
  appointments: "Upcoming appointments",
  staff: "Team roster",
};
