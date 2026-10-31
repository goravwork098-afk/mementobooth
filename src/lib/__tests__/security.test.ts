import {
  checkIpSecurity,
  recordSuspiciousFailure,
  recordSuccessfulAuth,
} from "../security";
import prisma from "@/lib/prisma";

describe("Database-Backed Suspicious IP & Threat Protection", () => {
  const testIp = "198.51.100.42";

  beforeEach(async () => {
    // Clean up test records
    await prisma.suspiciousIpRecord.deleteMany({
      where: { ipAddress: testIp },
    });
  });

  afterAll(async () => {
    await prisma.suspiciousIpRecord.deleteMany({
      where: { ipAddress: testIp },
    });
  });

  it("permits initial check for unknown or unblocked IP", async () => {
    const res = await checkIpSecurity(testIp);
    expect(res.blocked).toBe(false);
  });

  it("increments failed attempts in the database on security failure", async () => {
    const res1 = await recordSuspiciousFailure(testIp, "TEST_FAILED_OTP", 5, 30);
    expect(res1.failedAttempts).toBe(1);
    expect(res1.isBlocked).toBe(false);

    const res2 = await recordSuspiciousFailure(testIp, "TEST_FAILED_OTP", 5, 30);
    expect(res2.failedAttempts).toBe(2);
    expect(res2.isBlocked).toBe(false);
  });

  it("automatically flags and blocks IP when failure threshold is breached (5 attempts)", async () => {
    for (let i = 1; i <= 4; i++) {
      const res = await recordSuspiciousFailure(testIp, "TEST_FAILED_OTP", 5, 30);
      expect(res.failedAttempts).toBe(i);
      expect(res.isBlocked).toBe(false);
    }

    // 5th attempt breaches the threshold
    const finalAttempt = await recordSuspiciousFailure(
      testIp,
      "EXCESSIVE_FAILED_OTP",
      5,
      30
    );
    expect(finalAttempt.failedAttempts).toBe(5);
    expect(finalAttempt.isBlocked).toBe(true);
    expect(finalAttempt.blockedUntil).toBeDefined();

    // Verify checkIpSecurity now actively blocks the request
    const securityCheck = await checkIpSecurity(testIp);
    expect(securityCheck.blocked).toBe(true);
    expect(securityCheck.reason).toBe("EXCESSIVE_FAILED_OTP");
    expect(securityCheck.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets failed attempt counter on successful authentication", async () => {
    await recordSuspiciousFailure(testIp, "MISTYPED_CODE", 5, 30);
    await recordSuspiciousFailure(testIp, "MISTYPED_CODE", 5, 30);

    // Legitimate user completes authentic sign-in
    await recordSuccessfulAuth(testIp);

    const record = await prisma.suspiciousIpRecord.findUnique({
      where: { ipAddress: testIp },
    });
    expect(record?.failedAttempts).toBe(0);
  });
});

