/**
 * In-memory ephemeral photo relay.
 *
 * Photos pass through for relay between two participants but are NEVER
 * persisted to disk/DB.  Entries auto-expire after 5 minutes.
 *
 * In production swap this for a Redis store with TTL.
 */

interface PhotoEntry {
  dataUrl: string;
  timestamp: number;
}

// Map<`${roomId}:${userId}`, PhotoEntry>
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

export function storePhoto(roomId: string, userId: string, dataUrl: string) {
  const key = `${roomId}:${userId}`;
  store.set(key, { dataUrl, timestamp: Date.now() });
}

export function getPhoto(
  roomId: string,
  userId: string
): string | null {
  const key = `${roomId}:${userId}`;
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.dataUrl;
}

export function getPartnerPhoto(
  roomId: string,
  currentUserId: string,
  allParticipantIds: string[]
): { userId: string; dataUrl: string } | null {
  for (const pid of allParticipantIds) {
    if (pid === currentUserId) continue;
    const photo = getPhoto(roomId, pid);
    if (photo) return { userId: pid, dataUrl: photo };
  }
  return null;
}

export function clearRoomPhotos(roomId: string) {
  for (const key of store.keys()) {
    if (key.startsWith(`${roomId}:`)) {
      store.delete(key);
    }
  }
}

export function hasPhoto(roomId: string, userId: string): boolean {
  return store.has(`${roomId}:${userId}`);
}
