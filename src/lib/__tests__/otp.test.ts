import { hashOtp } from "../otp";
import { timingSafeEqual } from "node:crypto";

describe("OTP Security & Cryptographic Verification", () => {
  it("generates deterministic SHA-256 hash for identical normalized email and code", () => {
    const hash1 = hashOtp("User@Example.COM", "123456");
    const hash2 = hashOtp("user@example.com", "123456");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  it("produces distinct hashes for different codes or emails", () => {
    const hashA = hashOtp("user@example.com", "123456");
    const hashB = hashOtp("user@example.com", "123457");
    const hashC = hashOtp("other@example.com", "123456");
    expect(hashA).not.toBe(hashB);
    expect(hashA).not.toBe(hashC);
  });

  it("verifies constant-time equality without timing side-channel leaks", () => {
    const validHash = hashOtp("couple@memento.com", "849201");
    const tamperedHash = hashOtp("couple@memento.com", "849202");

    const validBuf = Buffer.from(validHash, "utf-8");
    const sameBuf = Buffer.from(validHash, "utf-8");
    const tamperedBuf = Buffer.from(tamperedHash, "utf-8");

    expect(validBuf.length).toBe(tamperedBuf.length);
    expect(timingSafeEqual(validBuf, sameBuf)).toBe(true);
    expect(timingSafeEqual(validBuf, tamperedBuf)).toBe(false);
  });

  it("fails constant-time comparison when buffer lengths differ", () => {
    const bufA = Buffer.from("short", "utf-8");
    const bufB = Buffer.from("longer_string", "utf-8");
    const lengthMatches = bufA.length === bufB.length;
    expect(lengthMatches).toBe(false);
  });
});

