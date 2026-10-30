-- AlterTable
ALTER TABLE "EmailOtp" ADD COLUMN "ipAddress" TEXT;

-- CreateTable
CREATE TABLE "RateLimitRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailOtp_ipAddress_createdAt_idx" ON "EmailOtp"("ipAddress", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitRecord_key_key" ON "RateLimitRecord"("key");

-- CreateIndex
CREATE INDEX "RateLimitRecord_key_expiresAt_idx" ON "RateLimitRecord"("key", "expiresAt");
