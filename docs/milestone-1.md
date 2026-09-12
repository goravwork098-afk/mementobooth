# Milestone 1: Authentication and Private Rooms

> **Goal:** Turn the Milestone 0 UI shell into a secure, usable account and private-room foundation for two authenticated participants.

## Scope

This milestone covers account authentication, room ownership and invitations, the two-person lobby, room expiry, and the signaling contract required before the photo booth MVP. Browser media capture, photo composition, frame editing, Drive export, billing, and video remain future milestones.

## Phase 1: Authentication Foundation

- [ ] Select and configure Auth.js with the existing Prisma user/account/session models.
- [ ] Implement email magic-link authentication.
- [ ] Implement Google sign-in.
- [ ] Record Apple sign-in as deferred until a later authentication milestone.
- [ ] Add authenticated session access for server components, route handlers, and client UI.
- [ ] Implement sign-out.
- [ ] Implement account deletion with confirmation and cascading account data cleanup.
- [ ] Protect authenticated routes and redirect unauthenticated users to login.
- [ ] Show clear loading, success, failure, and expired-link states.

## Phase 2: Room Creation and Invitations

- [ ] Add a server-side room creation action/route for authenticated users.
- [ ] Generate the room token with a cryptographically secure random source.
- [ ] Generate a unique, human-readable display code without using it as authorization.
- [ ] Enforce the room owner’s monthly room entitlement on the server.
- [ ] Create the host `RoomParticipant` record atomically with the room.
- [ ] Return an invitation URL containing the secure token.
- [ ] Add QR-code generation from the invitation URL.
- [ ] Add copy/share actions with success and failure feedback.
- [ ] Record non-media room lifecycle events without logging secrets or media.

## Phase 3: Join and Access Control

- [ ] Add a token-based invitation route using a Next.js dynamic segment.
- [ ] Validate token existence, room status, expiry, and participant capacity server-side.
- [ ] Require authentication before joining while preserving the invitation context.
- [ ] Allow the owner to re-open their active room.
- [ ] Allow exactly one invited guest to join.
- [ ] Reject invalid, expired, completed, and full rooms with safe user-facing states.
- [ ] Prevent access when only the display code is supplied without a valid token.
- [ ] Prevent a user from joining the same room in conflicting roles or creating duplicate memberships.

## Phase 4: Private Room Lobby

- [ ] Build a real room lobby page for the host and guest.
- [ ] Show participant names, connection state, camera permission state, microphone permission state, and ready state.
- [ ] Add explicit ready/unready controls.
- [ ] Transition the room through `WAITING` and `READY` only when the required participants and device states are present.
- [ ] Add an expiration countdown based on server data, not only client time.
- [ ] Handle refresh, reconnect, leave, and host close-room actions.
- [ ] Ensure expired rooms cannot transition back to active states.
- [ ] Keep all room operations idempotent under retries and duplicate requests.

## Phase 5: Signaling Contract

- [ ] Choose and document the signaling transport and deployment boundary.
- [ ] Add a WebSocket signaling endpoint/service for room-scoped connections.
- [ ] Authenticate signaling connections and verify room membership before subscription.
- [ ] Support ephemeral offer, answer, and ICE-candidate messages only.
- [ ] Support heartbeat, disconnect detection, and cleanup when a participant leaves.
- [ ] Do not persist or log SDP media payloads, camera frames, audio, or video blobs.
- [ ] Apply rate limits to room creation, invitation validation, and signaling messages.
- [ ] Add configuration for STUN servers and a TURN fallback placeholder.

## Phase 6: Testing and Security Verification

- [ ] Add unit tests for token generation, display-code uniqueness, room transitions, expiry, and capacity rules.
- [ ] Add integration tests for sign-in, room creation, invitation join, duplicate join, and unauthorized access.
- [ ] Test expired and completed room behavior.
- [ ] Test reconnect and duplicate-request behavior in the lobby.
- [ ] Verify that application logs and database records contain no media payloads or sensitive invitation secrets.
- [ ] Verify rate limiting and basic abuse responses.
- [ ] Run Prisma validate/generate, lint, type checking, and production build.
- [ ] Manually verify host and guest flows on two browser sessions/devices.

## Exit Criteria

- Two real users can authenticate and join the same private room from separate browser sessions.
- A room has one authenticated host and at most one authenticated guest.
- Invitation authorization requires the secure token; the display code is informational only.
- Invalid, full, completed, and expired rooms are rejected server-side.
- Both participants can see lobby connection and ready state.
- The room expires reliably according to server-side timestamps.
- Signaling is authenticated, room-scoped, rate-limited, and contains no persisted media.
- Prisma, lint, type checking, build, and the focused test suite pass.

## Out of Scope

- Camera preview and permissions UX beyond lobby state reporting.
- Synchronized countdown and shutter capture.
- Canvas composition and frame rendering.
- Custom frame editing.
- Google Drive export.
- Stripe billing integration.
- Synchronized video.
