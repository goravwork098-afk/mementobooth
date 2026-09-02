# Couple Photobooth Technical Architecture

## Architecture Goals

- Support two authenticated participants on separate devices.
- Keep media out of application servers.
- Work reliably on mobile browsers.
- Support paid plans without changing the media privacy model.
- Allow default and user-created frames.
- Make the first release simple enough to validate quickly.
- Keep the backend contract reusable by future iOS and Android clients.

## Recommended Stack

### Web Client (Initial Product)

- React
- TypeScript
- Vite
- Progressive Web App support
- Canvas API for photo composition
- MediaRecorder API for short videos
- WebRTC for peer-to-peer communication

The initial client is a responsive web application. Native apps are not part of the first implementation.

### Future Native Clients

Native iOS and Android clients can later use the same authentication, room, plan, frame, and signaling APIs. Platform-specific camera and export code should live in the native client rather than changing the backend media model.

### Platform Services

- Supabase Auth for passwordless and social login
- PostgreSQL for users, plans, rooms, frames, and usage counters
- Stripe for subscriptions and billing events
- WebSocket signaling service using Cloudflare Durable Objects
- coturn or a managed TURN service for difficult networks
- Google Identity Services and Google Drive API for opt-in Drive export

## System Boundaries

### Persistent Backend Data

- User accounts
- Subscription and entitlement state
- Room ownership and status
- Participant membership
- Frame catalog metadata
- Usage counters
- Plan entitlements and feature flags
- Audit and security events without media

### Ephemeral Signaling Data

- Temporary peer IDs
- WebRTC offers and answers
- ICE candidates
- Connection and readiness state

Signaling data should expire with the room and must never include media blobs.

### Browser-Only Media Data

- Camera streams
- Captured photos
- Captured video blobs
- Canvas composition state
- Exported files before download or Drive upload

## Authentication Flow

Support Google, Apple, and email magic-link login. A user must be authenticated before entering a room. The invitation page should show the purpose of the invitation before asking the invited user to register.

## Entitlements and Feature Flags

All free and paid behavior must use a centralized entitlement service. Components must not hardcode plan names such as `free` or `pro`.

```ts
type Entitlements = {
  maxRoomsPerMonth: number;
  canUsePremiumFrames: boolean;
  canUseCustomFrameEditor: boolean;
  canExportHd: boolean;
  canExportVideo: boolean;
  canUploadToDrive: boolean;
  watermark: "none" | "standard";
};
```

Store plan rules in versioned server configuration or database records. Feature flags support trials, experiments, launch changes, and moving a feature from free to paid without rewriting UI or media code. The backend must enforce billing-sensitive entitlements; client checks are for user experience.

Supported states include Free, Trial, Paid active, Past due, Canceled until period end, Expired, and Grandfathered legacy plan.

## Room Flow

1. Authenticated owner requests a room.
2. Backend creates a cryptographically random room token.
3. Backend returns a human-readable code and invitation URL.
4. Participant authenticates and submits the invitation token.
5. Signaling service establishes the WebRTC session.
6. Room metadata is marked active.
7. Room expires after completion or inactivity.

Use unpredictable internal tokens. Do not authorize a room using only a sequential or easily guessed display code.

## WebRTC Design

Use `RTCPeerConnection` for encrypted peer communication and a data channel for capture-control messages such as ready, countdown, capture, retake, and completion. Use TURN only as a network fallback. TURN relays encrypted traffic but must not persist it.

## Media Composition

### Photos

Use Canvas to place each participant's image into frame-defined slots, apply crop rules, draw decorations and text, and export a PNG or JPEG blob.

### Videos

Start with short clips captured through MediaRecorder. Video composition should be a later milestone because encoding support differs across Safari, Chrome, and mobile devices. Prefer WebM where supported and provide a raw-clip download fallback.

## Frame System

Frames are data-driven templates with a fixed canvas, photo slots, decorations, and optional text layers. The renderer should not contain frame-specific business logic.

Custom frame documents are stored locally in the browser unless the user explicitly chooses to export or share them.

## Suggested Web Source Structure

```text
src/
  app/
  components/
  pages/
  features/
    auth/
    room/
    connection/
    capture/
    composer/
    frames/
    frame-editor/
    drive/
    billing/
  hooks/
  lib/
  styles/
signaling/
tests/
```

Future native applications should live in separate top-level packages, for example `apps/ios` and `apps/android`, after the web product and API contracts are stable.

## Security Requirements

- Use HTTPS everywhere.
- Use short-lived room tokens and expiration times.
- Validate authenticated room membership on every room operation.
- Never log image, video, camera, or microphone payloads.
- Keep Google OAuth scopes narrow.
- Do not put media in analytics events.
- Rate-limit room creation, invitation validation, and signaling messages.
