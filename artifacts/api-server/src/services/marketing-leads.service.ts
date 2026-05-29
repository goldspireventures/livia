import { db, marketingLeadsTable } from "@workspace/db";
import { generateId } from "../lib/id";

export interface CreateMarketingLeadInput {
  email: string;
  source?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export async function createMarketingLead(
  input: CreateMarketingLeadInput,
): Promise<{ id: string }> {
  const id = generateId();
  await db.insert(marketingLeadsTable).values({
    id,
    email: input.email.trim().toLowerCase(),
    source: input.source ?? "livia-hq.com",
    referrer: input.referrer ?? null,
    utmSource: input.utmSource ?? null,
    utmMedium: input.utmMedium ?? null,
    utmCampaign: input.utmCampaign ?? null,
  });
  return { id };
}
