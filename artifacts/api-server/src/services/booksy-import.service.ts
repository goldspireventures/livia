import { createCustomer } from "./customers.service";

/** Minimal Booksy CSV: firstName,lastName,email,phone (header row optional). */
export async function importBooksyCsv(businessId: string, csvText: string) {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { imported: 0, skipped: 0, errors: ["Empty file"] };

  const start = lines[0]?.toLowerCase().includes("first") ? 1 : 0;
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    const [firstName, lastName, email, phone] = parts;
    if (!firstName) {
      skipped++;
      continue;
    }
    try {
      await createCustomer(businessId, {
        firstName,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
      });
      imported++;
    } catch {
      errors.push(`Row ${i + 1}: could not import`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}
