# Engineering Roadmap & Daily Progress Checklist

> **Single Source of Truth for Project Architecture, Milestone Execution, and Bug Remediation**  
> **Last Updated:** 2026-10-30  
> **Overall Project Completion:** ~45%

---

## Progress Dashboard

| Milestone / Feature Module | Status | Progress | Priority |
| :--- | :---: | :---: | :---: |
| **0. Foundation, Database & Design System** | Complete | 90% | P1 |
| **1. Authentication & Private Room Security** | Hardened | 85% | P0 |
| **2. Sequential Multi-Slot Capture Engine** | Operational | 80% | P0 |
| **3. Synchronized Retake & Canvas Composer** | Operational | 75% | P1 |
| **4. Cloud Storage, Export & Social Sharing** | Backlog | 0% | P2 |
| **5. Subscriptions, Stripe & Entitlements** | Scaffolding | 10% | P2 |
| **6. Continuous Integration & Quality Testing** | Passing | 65% | P0 |

---

## Phase 1: Foundation & Design System Hardening

- [x] Prisma PostgreSQL schema configured with User, Room, RoomParticipant, Frame, UsageRecord, Subscription, and Event models.
- [x] Initial seed script created with standard romantic frame presets (Korean Mall 4-Cut, Sweetheart Duo Polaroid, Midnight Vintage Noir).
- [x] Responsive CSS design tokens configured for romantic color palette, film borders, and glassmorphism.
- [ ] **Fix**: Update landing page call-to-action buttons to redirect authenticated users to the dashboard and unauthenticated users to sign-up (replace dead `#join` and `#top` anchor targets).
- [ ] **Feature**: Implement interactive "Enter Room Code" quick-join modal on the landing page for guests with display codes.
- [ ] **Enhancement**: Verify mobile layout responsiveness across devices (320px to 1440px).

---

## Phase 2: Authentication & Private Room Security (P0)

### 2.1 Authentication Unification & User Identity
- [x] NextAuth / Auth.js framework initialized with JWT session strategy.
- [x] Email OTP creation and consumption infrastructure in place.
- [x] **Bug Fix**: Unify login and sign-up flows so both use the secure 6-digit OTP verification system.
- [x] **Bug Fix**: Ensure user display names entered during sign-up are stored in the database instead of being discarded.
- [x] **Security Fix**: Enforce `crypto.timingSafeEqual` constant-time comparisons in OTP verification.
- [x] **Security Fix**: Database-backed sliding-window rate limiting per client IP (max 5/10min) and email (max 3/10min).
- [ ] **Bug Fix**: Fall back to Google profile display names gracefully when OAuth sign-in is used.
- [ ] Account deletion action cascading verification: ensure host deletion cleans up active rooms safely.

### 2.2 Room Creation, Cryptographic Tokens & Quotas
- [x] Cryptographic invitation token generation with unique URLs (`/join/[token]`).
- [x] **Bug Fix**: Replace `Math.random()` in room display code generator (`generateRoomCode`) with `crypto.randomInt` for cryptographic security.
- [x] **Bug Fix**: Enforce monthly room entitlement checks inside an atomic transaction with concurrency locks to prevent quota bypass.
- [x] **Bug Fix**: Validate user's Pro subscription status before enforcing free-tier monthly room limits.
- [ ] QR code generation for room invitation links verified and functional.

### 2.3 Access Control & Room Admission
- [x] Token-based invitation validation controller (`/join/[token]`).
- [x] **Bug Fix**: Allow existing participants to re-enter rooms in `READY` status upon browser refresh (fix order-of-checks bug in join controller).
- [ ] Prevent duplicate participant records with database-level isolation.
- [ ] Prevent unauthenticated room access and enforce redirect to login with safe callback preservation.

---

## Phase 3: Sequential Multi-Slot Capture Engine (P0)

### 3.1 Synchronized Distributed Countdown
- [x] Host duration selector (3s, 5s, 10s countdown).
- [x] **Bug Fix**: Synchronize client-server clock offset during room status polling to prevent desynchronized shutter triggers caused by local device clock drift.
- [ ] Audio countdown beeps and shutter sound effect (synthesized via Web Audio API or audio assets).

### 3.2 Multi-Pose Capture Sequence
- [x] **Bug Fix**: Upgrade capture engine from single-shot to sequential multi-pose flow:
  - Read `slotCount` from selected frame configuration (e.g. 4 poses for 4-cut).
  - Iterate through `slotIndex` 0 to `N - 1` with visual pose badge indicator ("Pose X of Y").
  - Store captured data URLs indexed by slot.
- [x] Shutter flash visual feedback on each capture slot.
- [ ] Camera selector toggle (front vs back camera on mobile devices).
- [ ] Video mirror preview toggle for comfortable posing.

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
- [ ] Responsive canvas preview scaling for mobile screens without blurring.
- [ ] Photo slot pan-and-zoom / cropping adjustment controls.
- [ ] High-definition (300 DPI) print-ready export resolution mode.

---

## Phase 5: Cloud Storage & Sharing (P2)

- [ ] Google Drive OAuth picker integration for saving keepsakes directly to user's personal cloud.
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

## Daily Execution Log

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

