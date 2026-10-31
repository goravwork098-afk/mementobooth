-- CreateTable
CREATE TABLE "SuspiciousIpRecord" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 1,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedUntil" TIMESTAMP(3),
    "reason" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuspiciousIpRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuspiciousIpRecord_ipAddress_key" ON "SuspiciousIpRecord"("ipAddress");

-- CreateIndex
CREATE INDEX "SuspiciousIpRecord_ipAddress_isBlocked_idx" ON "SuspiciousIpRecord"("ipAddress", "isBlocked");

-- CreateIndex
CREATE INDEX "SuspiciousIpRecord_blockedUntil_idx" ON "SuspiciousIpRecord"("blockedUntil");

