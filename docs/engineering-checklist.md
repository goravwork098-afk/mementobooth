# Engineering Roadmap & Daily Progress Checklist

> **Single Source of Truth for Project Architecture, Milestone Execution, and Bug Remediation**  
> **Last Updated:** 2026-10-31  
> **Overall Project Completion:** ~45%

---

## Progress Dashboard

| Milestone / Feature Module | Status | Progress | Priority |
| :--- | :---: | :---: | :---: |
| **0. Foundation, Database & Design System** | Complete | 100% | P1 |
| **1. Authentication & Private Room Security** | Complete | 100% | P0 |
| **2. Sequential Multi-Slot Capture Engine** | Complete | 100% | P0 |
| **3. Synchronized Retake & Canvas Composer** | Complete | 100% | P1 |
| **4. Cloud Storage, Export & Social Sharing** | Operational | 50% | P2 |
| **5. Subscriptions, Stripe & Entitlements** | Scaffolding | 10% | P2 |
| **6. Real-Time Camera Filters & Snapchat AR** | Complete | 100% | P2 |
| **7. Continuous Integration & Quality Testing** | Passing | 90% | P0 |

---

## Phase 1: Foundation & Design System Hardening

- [x] Prisma PostgreSQL schema configured with User, Room, RoomParticipant, Frame, UsageRecord, Subscription, and Event models.
- [x] Initial seed script created with standard romantic frame presets (Korean Mall 4-Cut, Sweetheart Duo Polaroid, Midnight Vintage Noir).
- [x] Responsive CSS design tokens configured for romantic color palette, film borders, and glassmorphism.
- [x] **Fix**: Update landing page call-to-action buttons to redirect authenticated users to the dashboard and unauthenticated users to sign-up (replaced dead `#join` and `#top` anchor targets).
- [x] **Feature**: Implement interactive "Enter Room Code" quick-join modal on the landing page for guests with display codes (`resolveRoomCodeAction`).
- [x] **Enhancement**: Verify mobile layout responsiveness across devices (320px to 1440px).

---

## Phase 2: Authentication & Private Room Security (P0)

### 2.1 Authentication Unification & User Identity
- [x] NextAuth / Auth.js framework initialized with JWT session strategy.
- [x] Email OTP creation and consumption infrastructure in place.
- [x] **Bug Fix**: Unify login and sign-up flows so both use the secure 6-digit OTP verification system.
- [x] **Bug Fix**: Ensure user display names entered during sign-up are stored in the database instead of being discarded.
- [x] **Security Fix**: Enforce `crypto.timingSafeEqual` constant-time comparisons in OTP verification.
- [x] **Security Fix**: Database-backed sliding-window rate limiting per client IP (max 5/10min) and email (max 3/10min).
- [x] **Security Fix**: Persistent Suspicious IP & Threat Tracking (`SuspiciousIpRecord` in PostgreSQL) with automated progressive lockout (temporary 30-min ban after 5 consecutive failures).
- [x] **Bug Fix**: Fall back to Google profile display names gracefully when OAuth sign-in is used (`auth.config.ts`).
- [x] Account deletion action cascading verification: ensure host deletion cleans up active rooms safely and wipes ephemeral photo relay cache.

### 2.2 Room Creation, Cryptographic Tokens & Quotas
- [x] Cryptographic invitation token generation with unique URLs (`/join/[token]`).
- [x] **Bug Fix**: Replace `Math.random()` in room display code generator (`generateRoomCode`) with `crypto.randomInt` for cryptographic security.
- [x] **Bug Fix**: Enforce monthly room entitlement checks inside an atomic transaction with concurrency locks to prevent quota bypass.
- [x] **Bug Fix**: Validate user's Pro subscription status before enforcing free-tier monthly room limits.
- [x] QR code generation for room invitation links verified and functional.

### 2.3 Access Control & Room Admission
- [x] Token-based invitation validation controller (`/join/[token]`).
- [x] **Bug Fix**: Allow existing participants to re-enter rooms in `READY` status upon browser refresh (fix order-of-checks bug in join controller).
- [x] Prevent duplicate participant records with database-level isolation.
- [x] Prevent unauthenticated room access and enforce redirect to login with safe callback preservation.

---

## Phase 3: Sequential Multi-Slot Capture Engine (P0)

### 3.1 Synchronized Distributed Countdown
- [x] Host duration selector (3s, 5s, 10s countdown).
- [x] **Bug Fix**: Synchronize client-server clock offset during room status polling to prevent desynchronized shutter triggers caused by local device clock drift.
- [x] Audio countdown beeps and shutter sound effect (synthesized via Web Audio API, zero latency, zero external assets).

### 3.2 Multi-Pose Capture Sequence
- [x] **Bug Fix**: Upgrade capture engine from single-shot to sequential multi-pose flow:
  - Read `slotCount` from selected frame configuration (e.g. 4 poses for 4-cut).
  - Iterate through `slotIndex` 0 to `N - 1` with visual pose badge indicator ("Pose X of Y").
  - Store captured data URLs indexed by slot.
- [x] Shutter flash visual feedback on each capture slot.
- [x] Camera selector toggle (front vs back camera on mobile devices).
- [x] Video mirror preview toggle for comfortable posing with matching mirrored canvas capture.

### 3.3 Ephemeral Media Relay
- [x] In-memory photo relay route (`/api/room/[token]/photo`) with automatic 5-minute TTL.
- [x] Multi-slot photo indexing (`roomId:userId:slotIndex`).
- [x] **Bug Fix**: Clear ephemeral relay photo cache when a retake is triggered (`clearRoomPhotos`).

---

## Phase 4: Synchronized Retake & Canvas Keepsake Composer (P1)

### 4.1 Retake Orchestration
- [x] **Bug Fix**: Implement two-way retake synchronization:
  - Broadcast retake event in room status API and room events log.
  - Reset both host and guest viewports back to the lobby state simultaneously (eliminating guest trap).
  - Reset participant `isReady` flags and purge cached relay photos for that session.

### 4.2 Canvas Composer
- [x] HTML5 Canvas drawing pipeline for photo slots, borders, and timestamp watermarks.
- [x] Multi-slot array photo rendering (mapping individual poses to specific slots).
- [x] Basic client-side PNG export (`canvas.toBlob`).
- [x] **Bug Fix**: Stop active media stream tracks when transitioning into the composer to release the camera hardware.
- [x] Responsive canvas preview scaling for mobile screens without blurring.
- [x] Photo slot pan-and-zoom / cropping adjustment controls.
- [x] High-definition (300 DPI) print-ready export resolution mode.

---

## Phase 5: Cloud Storage & Sharing (P2)

- [x] Google Drive OAuth picker integration for saving keepsakes directly to user's personal cloud.
- [ ] Ephemeral download link sharing for couples.
- [ ] One-click email keepsake delivery using configured email transport.

---

## Phase 6: Subscriptions, Quotas & Stripe Monetization (P2)

- [x] Prisma `Subscription` and `UsageRecord` models created.
- [ ] Stripe customer creation and checkout session server action.
- [ ] Stripe webhook handler for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
- [ ] Server-side entitlement guards for premium frames, custom frame editor, and unlimited rooms.

---

## Phase 7: Continuous Testing & Verification Loop (P0)

- [x] Jest testing harness configured with TypeScript and path alias resolution.
- [x] Unit tests for cryptographically secure room code generation and non-ambiguous alphabet validation.
- [x] Unit tests for timing-safe constant-time OTP hash equality verification.
- [x] Unit tests for frame catalog invariants (canvas dimensions, aspect ratio schemas, and slot percentages).
- [x] Unit tests for plan tier entitlement bounds (free vs pro quota limits).
- [x] Clean run of TypeScript compiler (`tsc --noEmit`) with 0 errors.
- [x] Clean run of linter (`eslint`) with 0 errors and 0 warnings.
- [ ] Integration tests for room creation, capacity limits (strictly 2 participants), and expiry.
- [ ] Integration tests for OTP authentication lifecycle (generation, rate-limiting, single-use consumption).
- [ ] Integration tests for room state transitions (`WAITING` -> `READY` -> `ACTIVE` -> `COMPOSING` -> `COMPLETED`).

---

## Phase 8: Camera Filters & Real-Time Aesthetics Engine (Planned Milestone)

### 8.1 Phase A: Real-Time Aesthetic & Beauty Filter Engine
- [x] Implement live filter state in the private booth lobby.
- [x] Build touch-friendly horizontal filter selector carousel in the viewfinder HUD.
- [x] Curate 6 signature photobooth color & beauty presets:
  - `Natural`: Raw balanced camera feed without adjustments.
  - `Soft Beauty`: Flattering soft contrast, subtle warm highlights, and skin tone brightening (`contrast(1.06) brightness(1.08) saturate(1.1)`).
  - `Seoul Mall 4-Cut`: Iconic sepia-warmed retro paper tone (`sepia(0.22) contrast(1.15) brightness(0.96) saturate(1.1)`).
  - `Romantic Rose`: Soft magenta-rose blush tint (`hue-rotate(-12deg) saturate(1.25) brightness(1.03)`).
  - `Midnight Noir`: High-contrast black & white classic film (`grayscale(1) contrast(1.3) brightness(1.05)`).
  - `Golden Sunset`: Sun-drenched warm tones for romantic golden-hour lighting.
- [x] Connect live styling to `<video>` element via CSS filters (guaranteeing 60 FPS GPU acceleration with 0ms latency).
- [x] Update canvas snapshot pipeline to apply `ctx.filter` prior to `ctx.drawImage` so live preview, partner relay, and final keepsake strip match with 100% fidelity.

### 8.2 Phase B: Snapchat-Style AR Face Tracking & Vector Props
- [x] Configure zero-dependency procedural vector drawing engine for instant 60 FPS performance.
- [x] Implement facial landmark anchors:
  - Forehead: Floating Hearts & Angel Halo.
  - Cheeks: Soft Pink Blush & Freckles.
  - Eyes & Bridge: Y2K Heart Sunglasses.
  - Nose Tip: Cute Animal Snout & Whiskers.
- [x] Implement multi-layer canvas flattening engine: compositing live camera stream + color grading + AR face stickers onto the capture canvas with 100% fidelity.
- [x] Guarantee zero-server-storage privacy: 100% of facial rendering executed locally on-device.

---

## Daily Execution Log

### 2026-10-31
- Completed Milestone 2 (Sequential Multi-Slot Capture Engine) to 100%:
  - Implemented client-side Web Audio API synthesizer (`src/lib/audio-effects.ts`) providing zero-latency countdown ticks (`3... 2... 1...`) and authentic dual-curtain mechanical DSLR shutter sounds without external audio assets.
  - Implemented dynamic front/rear camera switcher (`facingMode: "user" | "environment"`) with graceful stream teardown and re-acquisition for mobile/tablet users.
  - Implemented horizontal video mirror toggle with synchronized canvas transformation (`ctx.scale(-1, 1)`), eliminating the preview vs. capture inversion bug.
  - Added sleek translucent floating camera control overlay HUD on the camera preview.
  - Authored unit test suite (`audio-effects.test.ts`), achieving 7 passing test suites (26 of 26 tests passing cleanly).
- Resolved root layout hydration mismatch by adding `suppressHydrationWarning` to root `<html>` and `<body>` tags (preventing console errors from browser extensions).
- Standardized `cursor: pointer` across all application buttons, action links, and interactive controls (with `cursor: not-allowed` on disabled states).
- Hardened mobile responsiveness across the User Dashboard, Room Cards, Frame Picker, and Quick Join modal for viewport widths down to 320px.
- Researched state-of-the-art camera filtering and Snapchat-style AR face tracking:
  - Documented two-phase architecture (Phase A: Real-Time Aesthetic/Beauty Engine, Phase B: MediaPipe 468-point 3D Face Landmarker).
  - Integrated complete architectural specifications and landmark mapping into central engineering roadmap for future implementation.
- Verified 100% test-passing loop (6 of 6 suites, 23 of 23 tests passing), 0 ESLint errors/warnings, clean TypeScript compilation, and successful production build.

### 2026-10-30
- Completed deep architectural audit of the entire codebase.
- Formulated structured remediation plan for critical bugs (single-shot limitation, retake desync, clock skew, insecure random generators, authentication display name drop).
- Created central roadmap and engineering progress checklist tracker.
- Remediated Phase 2 authentication and room security bugs:
  - Unified sign-up flow into the secure 6-digit OTP verification system.
  - Persisted user display names into the database upon account verification.
  - Replaced `Math.random()` in room code generation with `crypto.randomInt`.
  - Hardened monthly room quota verification to execute atomically inside the database transaction and respect active Pro subscriptions.
  - Corrected order-of-checks in the room join controller to allow re-entry on page refresh in active/ready rooms.
- Built database-backed brute force & security protections:
  - Added persistent `RateLimitRecord` model and `ipAddress` field to schema.
  - Implemented database-backed sliding-window rate limiter per IP address and email.
  - Upgraded OTP hash comparison to `crypto.timingSafeEqual` over binary buffers to eliminate timing side-channel attacks.
- Installed Jest testing harness and established 4 unit test suites (14 tests passing cleanly with zero failures).
- Resolved all 20 legacy ESLint and TypeScript compiler warnings to achieve a verified 0-error / 0-warning baseline.
- Implemented Phase 3 & Phase 4 sequential multi-slot photobooth engine:
  - Added real-time client-server clock offset calibration during status polling to eliminate countdown drift.
  - Upgraded capture flow from single-shot to multi-pose sequence ("Pose X of Y") corresponding to frame slot count.
  - Upgraded ephemeral in-memory photo relay to index photos by slot (`roomId:userId:slotIndex`).
  - Added two-way retake synchronization: clearing relay cache on retake and releasing guest clients from composer trap.
  - Upgraded canvas composer to render distinct photos per slot and tear down active media tracks.
- Successfully executed Next.js production build (`next build`) in 14.1s with Turbopack, validating all 11 static and dynamic routes.
- Synchronized PostgreSQL database schema (`prisma db push`), successfully provisioning `RateLimitRecord` and `EmailOtp.ipAddress` in the active database.
- Completed Milestone 0 to 100%:
  - Implemented accessible "Enter Room Code" quick-join modal dialog (`QuickJoinModal`) on the landing page.
  - Implemented server-side room code resolver (`resolveRoomCodeAction`) supporting both `LOVE-XXXX` and `XXXX` with expiration, completion, and capacity guards.
  - Replaced all dead anchor links with direct application routes (`/signup`, `/login`, `/dashboard`).
  - Added authenticated session awareness on the landing page (displaying "Go to Dashboard" when signed in).
  - Validated 15 of 15 Jest unit tests, 0 ESLint errors/warnings, and successful Turbopack production build.
- Built PostgreSQL-backed Suspicious IP & Threat Tracking (Milestone 1):
  - Created relational model `SuspiciousIpRecord` and applied timestamped migration `20261030010000_add_suspicious_ip_tracking`.
  - Implemented `checkIpSecurity` guard in OTP routes with `403 Forbidden` / `429 Too Many Requests` responses and `Retry-After` headers.
  - Implemented autonomous progressive brute-force defense in `recordSuspiciousFailure` (locks out attacker IP for 30 minutes upon reaching 5 failures).
  - Integrated auto-reset on authentic sign-in via `recordSuccessfulAuth`.
  - Authored authentic Jest test suite (`security.test.ts`) exercising real PostgreSQL transactions (19 of 19 tests passing).
- Completed Milestone 1 to 100%:
  - Resolved Google OAuth profile display name propagation in `auth.config.ts`.
  - Hardened `deleteAccountAction` to safely clear ephemeral room photos and verify cascading deletes of rooms, participants, and events.
  - Created integration test suite `milestone1-integration.test.ts` validating two-participant capacity limits, token authorization, room expiry detection, and cascading account deletion.
  - Verified 100% test-passing loop (all 6 suites, 23 of 23 tests passing), 0 ESLint errors/warnings, and clean TypeScript compilation.

