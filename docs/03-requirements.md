# Couple Photobooth Requirements

## Functional Requirements

### Accounts

- Users must create an account before creating or joining a booth.
- Support Google, Apple, and email magic-link authentication.
- Users can sign out and delete their account.
- Account data must be separate from media data.

### Booths and Invitations

- An authenticated user can create a private booth.
- The system generates an invitation URL, QR code, and display code.
- Only invited authenticated users can join.
- A room supports two participants in the initial release.
- A room shows waiting, ready, active, completed, and expired states.
- Rooms expire after configurable inactivity and maximum-session limits.

### Camera and Capture

- Users can grant and revoke camera and microphone permissions.
- Users can switch front and rear cameras when supported.
- Users can mute the microphone.
- Users can choose 3, 5, or 10 second countdowns.
- Users can capture, preview, retake, and confirm media.
- Photo capture is required for MVP.
- Short video capture is required after the photo MVP is stable.

### Frames

- The product includes a default romantic frame catalog.
- Frames support two participant photo slots.
- Frames support crop, fit, rotation, and alignment rules.
- Users can add a custom frame with background, text, stickers, borders, and photo slots.
- Custom frames can be saved locally and reused.

### Export

- Users can download the final photo locally.
- Users can choose PNG or JPEG when supported.
- Users can upload a selected export directly to Google Drive.
- Drive upload must not route through our backend.
- Upload failure must not remove the local download option.

### Plans and Billing

- Plans define room, frame, export, video, and integration entitlements.
- The product must support a paid-first launch with a complete basic free path.
- Free limits must be configurable without deploying new frontend code.
- A feature must be able to move from free to paid through an entitlement or feature-flag change.
- Existing paid users can be grandfathered when pricing changes.
- The room owner is the billing owner.
- The invited participant can join an owner's active room with an account.
- Stripe webhooks update subscription status.
- The client must handle free, trial, active, past-due, canceled, expired, and grandfathered states.

### Entitlement Behavior

- Free users must have a complete basic photo workflow.
- Premium controls must show an upgrade state when unavailable.
- Limits must be enforced on the server for account and billing operations.
- Media generation remains local regardless of plan.
- Pricing changes must not invalidate downloaded media or locally saved frames.

## Non-Functional Requirements

- Responsive on modern desktop and mobile browsers.
- The initial release must be usable without installing an application.
- The web product may be installable as a PWA but must not depend on installation.
- Accessible keyboard and screen-reader controls where applicable.
- Clear camera and microphone permission states.
- Graceful handling of unsupported browsers and failed WebRTC connections.
- No server-side photo or video persistence.
- No media in application logs, analytics, or error reports.
- Room creation and signaling endpoints must be rate-limited.
- Core photo capture should work on Chrome, Safari, and Firefox mobile where browser permissions allow it.

## MVP Acceptance Criteria

- Two authenticated users can join one private room.
- Both users can see connection and ready status.
- Both users can capture a synchronized photo.
- The app composes both photos into at least five default frames.
- Users can retake and download the final result.
- No media request reaches the application backend.
- Expired rooms cannot be rejoined.
- Feature access is resolved through centralized entitlements rather than hardcoded plan checks.

## Out of Scope for MVP

- Group rooms larger than two people
- Public galleries
- Server-side media backup
- Full Canva-style frame editor
- Long-form video editing
- Native iOS or Android applications in the initial release
- Social feed and public discovery

## Future Platform Requirement

When native apps are introduced, they should reuse the existing account, subscription, room, frame, and privacy contracts. Native apps are a future delivery phase and must not force media uploads to the backend.
