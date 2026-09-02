# Couple Photobooth Milestones

## Milestone 0: Foundation and Decisions

Deliverables:

- Confirm product rules and privacy promise.
- Set up React, TypeScript, Vite, linting, and testing.
- Choose Supabase project, Stripe account, signaling deployment, and TURN provider.
- Define room, user, plan, frame, and usage schemas.
- Create the initial design tokens and mobile-first shell.

Exit criteria:

- Application runs locally and in a staging environment.
- Authentication and database environments are configured.

## Milestone 1: Authentication and Private Rooms

Deliverables:

- Sign in with Google and email magic links.
- Create booth page.
- Invitation URL, QR code, and display code.
- Authenticated join flow.
- Room waiting and expiration states.
- Temporary WebSocket signaling.

Exit criteria:

- Two real devices can authenticate and join the same room.
- Unauthorized users cannot join by guessing a display code.

## Milestone 2: Photo Booth MVP

Deliverables:

- Camera preview and permission handling.
- Countdown and synchronized capture.
- Retake and confirmation flow.
- WebRTC peer connection.
- Canvas-based photo composition.
- Five to ten default romantic frames.
- Local PNG/JPEG download.

Exit criteria:

- A couple can complete a full photo session on mobile devices.
- The backend receives no photo or video payload.

## Milestone 3: Plans and Billing

Deliverables:

- Free and paid plan definitions.
- Centralized entitlement service and plan configuration.
- Feature flags for free, trial, paid-only, and grandfathered states.
- Stripe checkout and customer portal.
- Entitlement checks for frames, resolution, watermark, Drive, video, and room limits.
- Usage counters and billing state handling.

Exit criteria:

- Paid features are enforced consistently on the client and backend.
- Subscription cancellation and expiration are handled correctly.
- Moving a feature from free to paid requires configuration changes, not component rewrites.

## Milestone 4: Google Drive Export

Deliverables:

- Google OAuth consent flow.
- Direct browser-to-Drive upload.
- Upload progress and failure states.
- Filename and export format selection.

Exit criteria:

- A user can save an export to Drive without the media passing through our server.

## Milestone 5: Custom Frame Creator

Deliverables:

- Fixed-size frame canvas.
- Add, move, resize, rotate, and delete layers.
- Text, colors, stickers, borders, and photo slots.
- Local save/load of frame documents.
- Reuse a custom frame in a booth.

Exit criteria:

- A user can create and reuse a custom frame without backend media storage.

## Milestone 6: Short Video

Deliverables:

- Synchronized short video capture.
- Video preview and retake.
- Basic split-screen composition.
- WebM export where supported.
- Fallback raw video download.

Exit criteria:

- Supported mobile browsers can complete a short video session without freezing or excessive memory use.

## Milestone 7: Production Hardening

Deliverables:

- Reconnect and recovery handling.
- Network diagnostics and TURN monitoring.
- Accessibility audit.
- Cross-browser device testing.
- Security review and privacy audit.
- Error monitoring configured without media payloads.
- PWA install and offline frame catalog support.

Exit criteria:

- The application is stable for a controlled beta launch.

## Future Milestone 8: Native Mobile Applications

This milestone begins only after the web product has validated retention, paid conversion, and the core technical flow.

Deliverables:

- Shared API and authentication contract for native clients.
- iOS application with native camera and export integrations.
- Android application with native camera and export integrations.
- Push notifications for invitations and room readiness.
- Offline frame editing where platform storage permits.
- App Store and Play Store release processes.

Exit criteria:

- Native clients provide the same core booth flow as the web application.
- Native clients preserve the no-server-media-storage privacy promise.
