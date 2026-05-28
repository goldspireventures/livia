import { and, eq } from "drizzle-orm";
import { db, petsTable } from "@workspace/db";
import { generateId } from "../lib/id";

export async function listPetsForCustomer(businessId: string, customerId: string) {
  return db
    .select()
    .from(petsTable)
    .where(and(eq(petsTable.businessId, businessId), eq(petsTable.customerId, customerId)));
}

export async function createPet(
  businessId: string,
  customerId: string,
  data: {
    name: string;
    species?: string;
    breed?: string;
    behaviourNotes?: string;
    allergyNotes?: string;
    vaccinationNotes?: string;
  },
) {
  const id = generateId();
  const [row] = await db
    .insert(petsTable)
    .values({
      id,
      businessId,
      customerId,
      name: data.name,
      species: data.species ?? "dog",
      breed: data.breed ?? null,
      behaviourNotes: data.behaviourNotes ?? null,
      allergyNotes: data.allergyNotes ?? null,
      vaccinationNotes: data.vaccinationNotes ?? null,
    })
    .returning();
  return row;
}
