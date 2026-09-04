# Milestone 0: Foundation, Database & Landing Page

> **Goal:** Lay the technical foundation using Bun and Prisma PostgreSQL, establish domain models, and build the mobile-first romantic landing page and UI shell.

---

## Phase 1: Environment & Package Foundation (Bun)
- [x] Ensure Bun runtime is active (`bun --version` -> v1.4.0).
- [x] Remove legacy `package-lock.json` and standardize on `bun.lock`.
- [x] Install core dependencies:
  - [x] `@prisma/client` (database ORM v6.4.1)
  - [x] `lucide-react` (modern romantic UI icons)
  - [x] `clsx` & `tailwind-merge` (flexible class merging)
  - [x] `canvas-confetti` & `@types/canvas-confetti` (interactive celebrations)
- [x] Install dev dependencies:
  - [x] `prisma` CLI (v6.4.1)

---

## Phase 2: Database Structure (Prisma + PostgreSQL)
- [x] Create `prisma/schema.prisma` configured for PostgreSQL datasource.
- [x] Define relational data models:
  - [x] `User`: id, email, name, avatarUrl, createdAt, updatedAt (+ NextAuth Account & Session)
  - [x] `Room`: id, code (display code e.g. `LOVE-42`), token (secure URL UUID), hostId, status (`WAITING`, `READY`, `ACTIVE`, `COMPOSING`, `COMPLETED`, `EXPIRED`), maxDurationSec, expiresAt, createdAt, updatedAt
  - [x] `RoomParticipant`: id, roomId, userId, role (`HOST`, `GUEST`), isReady, camera/mic flags, joinedAt
  - [x] `RoomEvent`: id, roomId, eventType, non-media metadata, createdAt
  - [x] `Frame`: id, slug, name, description, category, isPremium, configJson, createdById, createdAt
  - [x] `UsageRecord`: id, userId, yearMonth, roomsCreatedCount, updatedAt
  - [x] `Subscription`: id, userId, planTier, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd
- [x] Create `.env` and `.env.example` with PostgreSQL connection string (`postgres:postgres@localhost:5432/photobooth`).
- [x] Implement Prisma Client singleton in `src/lib/prisma.ts` for safe Next.js App Router reloads.
- [x] Run `bunx prisma validate` and `bunx prisma generate` (Validated & Generated cleanly).

---

## Phase 3: Core Domain Types & Schemas
- [x] `src/types/room.ts`:
  - [x] Room state machine types (`WAITING`, `READY`, `ACTIVE`, `COMPOSING`, `COMPLETED`, `EXPIRED`).
  - [x] WebRTC signaling & data channel messages (`HEARTBEAT`, `DEVICE_READY`, `FRAME_SELECTED`, `COUNTDOWN_START`, `CAPTURE_TRIGGER`, `PHOTO_CAPTURED`, `RETAKE_REQUEST`).
- [x] `src/types/frame.ts`:
  - [x] Frame template schema (canvas dimensions, photo slots, border styles, decorations, romantic sticker overlays).
  - [x] Default frame presets catalog definition (Korean Mall 4-Cut Strip, Sweetheart Duo Polaroid, Midnight Vintage Noir).
- [x] `src/types/entitlements.ts`:
  - [x] Entitlements contract (`maxRoomsPerMonth`, `canUsePremiumFrames`, `canUseCustomFrameEditor`, `canExportHd`, `canExportVideo`, `canUploadToDrive`, `watermark`).

---

## Phase 4: Romantic Design System & Tokens
- [x] Configure `src/app/globals.css` with romantic theme tokens:
  - [x] Color palette: Blush rose, velvet wine, warm champagne, soft cream, romantic dark mode.
  - [x] Photobooth strip styling: Film borders, perforation dots, realistic drop shadows.
  - [x] Glassmorphic card styling and smooth interactive micro-animations.
- [x] Configure `src/app/layout.tsx`:
  - [x] SEO titles, descriptions, theme colors, and responsive viewport meta tags.
  - [x] Geist font integration.

---

## Phase 5: Mobile-First Romantic Landing Page & UI Shell
- [x] Build `src/app/page.tsx`:
  - [x] **Navigation Header**: Brand logo with glowing heart, status indicator, and quick action buttons.
  - [x] **Hero Section**:
    - [x] Romantic headline & couple value proposition.
    - [x] Interactive live Photobooth Strip preview with simulated camera flashes and couple poses.
    - [x] Quick action CTA: "Create Private Booth" and "Enter Room Code".
  - [x] **Quick Join / Create Booth Dialogs**:
    - [x] Room code entry input (`LOVE-XX`).
    - [x] Interactive modal with generated room code and copyable invite link.
  - [x] **How It Works (3 Simple Steps)**:
    - [x] 1. Invite your partner with a private room link.
    - [x] 2. Pose and capture simultaneously from any two devices.
    - [x] 3. Download romantic framed photostrips instantly.
  - [x] **Privacy Promise Section**:
    - [x] Transparent guarantee: 100% peer-to-peer / in-browser processing; zero photos saved to servers.
  - [x] **Frame Showcase Carousel**:
    - [x] Interactive preview of romantic frame styles (4-cut, polaroid, heart).
  - [x] **Footer**:
    - [x] Privacy notes, copyright, and platform links.

---

## Phase 6: Verification & Quality Check
- [x] Run `bunx prisma validate` to confirm schema correctness (Passed).
- [x] Run `bunx prisma generate` to generate Prisma Client (Generated cleanly).
- [x] Run `bun run build` to ensure TypeScript compilation and zero Tailwind errors (Compiled in 8.1s).
- [x] Run `bun run lint` to verify code hygiene (0 errors, 0 warnings).

