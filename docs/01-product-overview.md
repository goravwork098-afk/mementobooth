# Couple Photobooth Product Overview

## Product Summary

Couple Photobooth is a privacy-first web application for long-distance couples. The first release runs in desktop and mobile browsers, with a responsive mobile-first experience and optional PWA installation. Two authenticated users join a private booth using an invitation link or room code, capture photos or short videos from separate devices, and create a shared photobooth result with romantic frames.

Users can download the result locally or save it directly to their own Google Drive. The product does not upload or permanently store photos and videos on its own servers.

## Product Principles

- Both participants must have an account.
- A room is private and invitation-based.
- The server coordinates accounts, rooms, plans, and connections only.
- Media is processed in the browser and remains on user devices by default.
- Local download is always available.
- Google Drive storage is opt-in and controlled by the user.
- The first experience should be fast, romantic, and simple on mobile.
- The initial product is web-first; native mobile applications are a future client layer.

## Target Users

- Long-distance couples
- Couples celebrating anniversaries or special dates
- Partners who want a shared digital keepsake
- Users who enjoy mall-style photobooth experiences but are not physically together

## Primary User Journey

1. User A creates an account.
2. User A creates a booth and receives an invitation link and code.
3. User B opens the invitation and creates an account.
4. Both users join the private booth.
5. Both grant camera and microphone permissions.
6. The couple selects a photo or video mode and a frame.
7. Each device captures its own media.
8. The browsers exchange media peer-to-peer and compose the result.
9. Users retake, edit, download, or save to Google Drive.
10. The room expires after completion or inactivity.

## Platform Strategy

### Phase 1: Web

The web application is the initial product. It should work from an invitation link without requiring installation, while supporting PWA installation for repeat users.

### Future: Native Apps

Native iOS and Android applications may be added later for improved camera controls, notifications, offline frame editing, and a smoother repeat-session experience. Native apps should reuse the same authentication, room, billing, frame, and signaling APIs. The media privacy rules must remain unchanged.

## Business Model

Accounts enable subscription plans, usage limits, invitations, saved frame preferences, and product analytics. Billing belongs to the room owner, while the invited participant can join the active room with an account.

Potential paid features include HD exports, no watermark, custom frames, premium frame packs, video export, and Google Drive export.

The product must support a paid-first launch with useful free alternatives. Free limits, trials, and feature access must be configurable so a feature can later move from free to paid without changing the capture or composition code.

## Privacy Promise

The account stores profile, room, subscription, and usage information. Captured photos and videos are not stored on our server unless a future feature explicitly asks the user to upload them. Google Drive saves go directly from the browser to the user's Drive.
