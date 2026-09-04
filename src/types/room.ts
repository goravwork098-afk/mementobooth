export type RoomStatus =
  | "WAITING"
  | "READY"
  | "ACTIVE"
  | "COMPOSING"
  | "COMPLETED"
  | "EXPIRED";

export type ParticipantRole = "HOST" | "GUEST";

export interface ParticipantState {
  id: string;
  userId: string;
  name: string;
  role: ParticipantRole;
  isReady: boolean;
  cameraGranted: boolean;
  micGranted: boolean;
  streamActive: boolean;
}

export interface RoomSession {
  id: string;
  code: string;
  token: string;
  status: RoomStatus;
  hostId: string;
  selectedFrameId?: string | null;
  expiresAt: string;
  createdAt: string;
  participants: ParticipantState[];
}

/**
 * WebRTC Signaling & RTCDataChannel Real-Time Messages
 * Strictly zero media payloads — control signals only!
 */
export type DataChannelSignal =
  | { type: "HEARTBEAT"; timestamp: number }
  | { type: "DEVICE_READY"; camera: boolean; mic: boolean }
  | { type: "FRAME_SELECTED"; frameId: string }
  | { type: "COUNTDOWN_START"; seconds: 3 | 5 | 10; slotIndex: number }
  | { type: "CAPTURE_TRIGGER"; slotIndex: number; timestamp: number }
  | { type: "PHOTO_CAPTURED"; slotIndex: number }
  | { type: "RETAKE_REQUEST"; slotIndex: number }
  | { type: "ALL_CAPTURES_COMPLETED" };
