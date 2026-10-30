import { randomInt } from "crypto";

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generates a cryptographically secure, non-ambiguous display code (e.g. `LOVE-4X9K`).
 * Excludes ambiguous visual glyphs: 0, 1, I, O.
 */
export function generateRoomCode(): string {
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += ROOM_CODE_ALPHABET.charAt(randomInt(0, ROOM_CODE_ALPHABET.length));
  }
  return `LOVE-${result}`;
}

export function isValidRoomCodeFormat(code: string): boolean {
  if (!code.startsWith("LOVE-")) return false;
  const suffix = code.slice(5);
  if (suffix.length !== 4) return false;
  for (const char of suffix) {
    if (!ROOM_CODE_ALPHABET.includes(char)) return false;
  }
  return true;
}

