-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;

CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
