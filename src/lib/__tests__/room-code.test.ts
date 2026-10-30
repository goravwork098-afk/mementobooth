import {
  generateRoomCode,
  isValidRoomCodeFormat,
  ROOM_CODE_ALPHABET,
} from "../room-code";

describe("Room Code Security & Generation", () => {
  it("generates codes matching the LOVE-XXXX format", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(/^LOVE-[A-Z2-9]{4}$/);
      expect(isValidRoomCodeFormat(code)).toBe(true);
    }
  });

  it("never includes ambiguous characters (I, O, 0, 1) in generated suffix", () => {
    expect(ROOM_CODE_ALPHABET).not.toContain("0");
    expect(ROOM_CODE_ALPHABET).not.toContain("1");
    expect(ROOM_CODE_ALPHABET).not.toContain("I");
    expect(ROOM_CODE_ALPHABET).not.toContain("O");

    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      const suffix = code.slice(5);
      expect(suffix).not.toContain("0");
      expect(suffix).not.toContain("1");
      expect(suffix).not.toContain("I");
      expect(suffix).not.toContain("O");
    }
  });

  it("correctly identifies invalid room codes", () => {
    expect(isValidRoomCodeFormat("")).toBe(false);
    expect(isValidRoomCodeFormat("LOVE")).toBe(false);
    expect(isValidRoomCodeFormat("LOVE-1234")).toBe(false); // '1' is invalid
    expect(isValidRoomCodeFormat("LOVE-ABCD0")).toBe(false); // too long & '0'
    expect(isValidRoomCodeFormat("LOVE-AB")).toBe(false); // too short
    expect(isValidRoomCodeFormat("HATE-ABCD")).toBe(false); // wrong prefix
  });

  it("demonstrates high entropy across 500 generated codes", () => {
    const generated = new Set<string>();
    for (let i = 0; i < 500; i++) {
      generated.add(generateRoomCode());
    }
    // With 32^4 = 1,048,576 combinations, collisions in 500 draws are extremely rare
    expect(generated.size).toBeGreaterThan(490);
  });
});
