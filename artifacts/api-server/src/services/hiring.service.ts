import { db, hiringPostsTable, hiringApplicationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function listHiringPosts(businessId: string) {
  return db
    .select()
    .from(hiringPostsTable)
    .where(eq(hiringPostsTable.businessId, businessId))
    .orderBy(desc(hiringPostsTable.createdAt));
}

export async function createHiringPost(
  businessId: string,
  input: { title: string; description?: string; roleType?: string },
) {
  const id = generateId();
  const [row] = await db
    .insert(hiringPostsTable)
    .values({
      id,
      businessId,
      title: input.title.trim(),
      description: input.description?.trim(),
      roleType: input.roleType?.trim(),
      status: "open",
    })
    .returning();
  return row;
}

export async function listApplications(postId: string) {
  return db
    .select()
    .from(hiringApplicationsTable)
    .where(eq(hiringApplicationsTable.postId, postId))
    .orderBy(desc(hiringApplicationsTable.createdAt));
}

export async function addApplication(
  postId: string,
  input: { applicantName: string; applicantEmail?: string; applicantPhone?: string; note?: string },
) {
  const id = generateId();
  const [row] = await db
    .insert(hiringApplicationsTable)
    .values({
      id,
      postId,
      applicantName: input.applicantName.trim(),
      applicantEmail: input.applicantEmail?.trim(),
      applicantPhone: input.applicantPhone?.trim(),
      note: input.note?.trim(),
    })
    .returning();
  return row;
}
