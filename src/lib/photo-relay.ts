/**
 * In-memory ephemeral photo relay.
 *
 * Photos pass through for relay between two participants but are NEVER
 * persisted to disk/DB. Entries auto-expire after 5 minutes.
 *
 * Indexed by `${roomId}:${userId}:${slotIndex}` for multi-slot sequences.
 */

interface PhotoEntry {
  dataUrl: string;
  timestamp: number;
}

// Map<`${roomId}:${userId}:${slotIndex}`, PhotoEntry>
const store = new Map<string, PhotoEntry>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.timestamp > TTL_MS) {
      store.delete(key);
    }
  }
}

// Run cleanup every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, 60_000);
}

export function storePhoto(
  roomId: string,
  userId: string,
  dataUrl: string,
  slotIndex: number = 0
) {
  const key = `${roomId}:${userId}:${slotIndex}`;
  store.set(key, { dataUrl, timestamp: Date.now() });
}

export function getPhoto(
  roomId: string,
  userId: string,
  slotIndex: number = 0
): string | null {
  const key = `${roomId}:${userId}:${slotIndex}`;
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.dataUrl;
}

export function hasPhoto(
  roomId: string,
  userId: string,
  slotIndex: number = 0
): boolean {
  return store.has(`${roomId}:${userId}:${slotIndex}`);
}

export function hasAllPhotos(
  roomId: string,
  userId: string,
  totalSlots: number
): boolean {
  for (let s = 0; s < totalSlots; s++) {
    if (!hasPhoto(roomId, userId, s)) return false;
  }
  return true;
}

export function getPartnerPhoto(
  roomId: string,
  currentUserId: string,
  allParticipantIds: string[],
  slotIndex: number = 0
): { userId: string; dataUrl: string } | null {
  for (const pid of allParticipantIds) {
    if (pid === currentUserId) continue;
    const photo = getPhoto(roomId, pid, slotIndex);
    if (photo) return { userId: pid, dataUrl: photo };
  }
  return null;
}

export function getAllPartnerPhotos(
  roomId: string,
  currentUserId: string,
  allParticipantIds: string[],
  totalSlots: number
): { userId: string; photos: Record<number, string> } | null {
  const partnerId = allParticipantIds.find((pid) => pid !== currentUserId);
  if (!partnerId) return null;

  const photos: Record<number, string> = {};
  for (let s = 0; s < totalSlots; s++) {
    const photo = getPhoto(roomId, partnerId, s);
    if (photo) {
      photos[s] = photo;
    }
  }
  return { userId: partnerId, photos };
}

export function clearRoomPhotos(roomId: string) {
  for (const key of store.keys()) {
    if (key.startsWith(`${roomId}:`)) {
      store.delete(key);
    }
  }
}

