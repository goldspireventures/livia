-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageLogStatus" AS ENUM ('RECEIVED', 'LINKED', 'UNMATCHED', 'REJECTED');

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'unknown',
    "direction" "MessageDirection" NOT NULL DEFAULT 'INBOUND',
    "channel" "ChannelType" NOT NULL,
    "fromValue" TEXT NOT NULL,
    "bodyPreview" TEXT NOT NULL,
    "payload" JSONB,
    "customerId" TEXT,
    "channelIdentityId" TEXT,
    "status" "MessageLogStatus" NOT NULL DEFAULT 'RECEIVED',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInteraction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "model" TEXT,
    "promptSummary" TEXT,
    "responseSummary" TEXT,
    "error" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageLog_businessId_createdAt_idx" ON "MessageLog"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageLog_businessId_channel_fromValue_idx" ON "MessageLog"("businessId", "channel", "fromValue");

-- CreateIndex
CREATE INDEX "AIInteraction_businessId_createdAt_idx" ON "AIInteraction"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "AIInteraction_userId_createdAt_idx" ON "AIInteraction"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_channelIdentityId_fkey" FOREIGN KEY ("channelIdentityId") REFERENCES "ChannelIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIInteraction" ADD CONSTRAINT "AIInteraction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIInteraction" ADD CONSTRAINT "AIInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
