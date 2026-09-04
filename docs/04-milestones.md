# Couple Photobooth Milestones

## Milestone 0: Foundation, Database & Landing Page (First Step)

Deliverables:
- Confirm product rules and privacy promise (zero server-side media storage).
- Set up Bun as the primary package manager (`bun.lock`, install dependencies).
- Set up Prisma ORM with PostgreSQL (`prisma/schema.prisma` and singleton client).
- Define database models: User, Account, Room, RoomParticipant, Frame, and Usage.
- Define core TypeScript types: rooms, participants, frames, capture states, and WebRTC messages.
- Create initial design system: romantic color tokens, elegant typography, responsive utilities.
- Build mobile-first Landing Page: hero film-strip demo, room creation modal/entry, privacy highlight, and feature preview.

Exit criteria:
- App runs cleanly with Bun (`bun dev` and `bun run build`).
- Prisma schema validates and generates types with `bunx prisma generate`.
- Landing page renders with responsive visual polish.

## Milestone 1: Authentication and Private Rooms

Deliverables:
- User authentication with email/magic-link and social logins.
- Create booth flow: generate secure cryptographic room token, short display code, and QR code.
- Room join flow: validate invitation token and authenticate guest.
- Room lobby state: waiting, participant ready checks, and expiration countdown.
- WebSocket signaling server setup for WebRTC handshake.

Exit criteria:
- Two real devices can authenticate and join the same private room.
- Unauthorized users cannot enter without a valid token.

## Milestone 2: Photo Booth Core Experience (MVP)

Deliverables:
- Dual-camera preview with front/rear toggle and permissions handling.
- Synchronized countdown (3s, 5s, 10s) via WebRTC DataChannel.
- Synchronized shutter capture on both devices.
- Retake, preview, and confirmation flow.
- Canvas-based photo composer: merge photos into multi-slot romantic frames.
- Initial catalog of 5+ default romantic frames (classic 4-cut strip, polaroid duo, heart frame, vintage).
- Direct local download (PNG/JPEG) on user device.

Exit criteria:
- A couple on separate devices can complete a full photo session.
- Photos are composed strictly inside the browser; zero media reaches our server.

## Milestone 3: Custom Frame Creator & Preset Catalog

Deliverables:
- Frame editor canvas: customize slots, borders, stickers, colors, and romantic text.
- Save custom frame templates locally (localStorage / IndexedDB).
- Import and select custom frames in live booth sessions.

Exit criteria:
- Users can create and use custom photo frames during booth sessions without backend uploads.

## Milestone 4: Google Drive Direct Export

Deliverables:
- Opt-in Google OAuth consent flow for Drive scope.
- Direct browser-to-Google Drive upload (resumable/multipart).
- Upload progress indicators and fallback to local download on failure.

Exit criteria:
- Users can save their photo strip directly into their personal Google Drive without server intermediary.

## Milestone 5: Synchronized Short Video

Deliverables:
- Synchronized short video clip recording via MediaRecorder.
- Side-by-side / split-screen video playback preview.
- Browser-based video clip export (WebM/MP4 fallback).

Exit criteria:
- Supported mobile browsers can capture and export short couple video clips without crashing or high memory strain.

## Milestone 6: Plans, Billing & Monetization (Moved to Final Phase)

Deliverables:
- Stripe checkout and customer billing portal integration.
- Centralized entitlement service (`canExportHd`, `watermark`, `canUsePremiumFrames`, `maxRoomsPerMonth`).
- Configurable free tier vs. pro tier feature gating.
- Stripe webhooks for subscription lifecycles (trial, active, past-due, canceled).

Exit criteria:
- Paid features (HD export, watermark removal, premium frames) cleanly unlock upon subscription.
- Free tier retains a complete, functional photo workflow.

## Milestone 7: Production Hardening & PWA

Deliverables:
- WebRTC reconnection resilience and TURN server failover monitoring.
- PWA manifest, service worker for frame assets, and install prompts.
- Accessibility, mobile browser compatibility, and privacy audit.

Exit criteria:
- Stable, production-ready web experience on mobile iOS Safari, Android Chrome, and desktop browsers.

## Milestone 8: Future Native Mobile Applications

Deliverables:
- Shared API contracts and signaling endpoints for native clients.
- Native iOS & Android companion apps using native camera APIs while keeping the same privacy model.
