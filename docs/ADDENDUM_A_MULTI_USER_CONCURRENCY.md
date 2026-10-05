# Addendum A — Multi-User Concurrency & Session Isolation

**Applies to:** Collaboration Space Development Contract  
**Product:** Databricks App Command & Control — Collaboration Space  
**Environment:** WDP Slot 1 — Bronze Collaboration  
**Status:** Mandatory architectural addendum

> **CORE REQUIREMENT:** One Databricks App slot does not imply one user or one logical application at a time. Collaboration Space is a shared multi-user host in which multiple authenticated users may concurrently interact with different logical applications, subject to the capacity of the shared Databricks App runtime.

## A1. Purpose

This addendum establishes the concurrency, identity, session-isolation, persistence, observability, and testing requirements needed for Collaboration Space to operate as a shared functional-review environment.

The Collaboration Space must support asynchronous and overlapping use by functional reviewers, product owners, engineers, and administrators. Multiple users may simultaneously review the same logical application or different logical applications without corrupting, leaking, or unintentionally sharing user-specific state.

## A2. Concurrency Model

The implementation shall assume all of the following can occur concurrently:

- Multiple authenticated users are signed into Collaboration Space.
- Different users launch different logical applications at the same time.
- Multiple users launch the same logical application and release at the same time.
- Users submit feedback against the same release concurrently.
- An administrator updates catalog/review metadata while reviewers are active.
- One logical application is updating or unavailable while other applications remain available.
- Background integration or status-refresh activity occurs while interactive users are active.

No implementation may rely on a single-active-user or single-active-logical-application assumption.

## A3. Identity and Session Isolation

1. Use the authenticated Databricks user context as the trusted user identity.
2. Never accept a client-supplied user ID as authoritative for feedback, audit, or administrative actions.
3. User-specific state must be scoped to the authenticated user/session or persisted under that user's identity.
4. Do not store current-user identity, selected application, feedback draft, permissions, or other user-specific state in process-global mutable variables.
5. A user's navigation, preferences, draft input, and activity must not appear in another user's session.
6. Authorization must be evaluated server-side for protected actions.
7. Logout/session expiration must fail safely and must not expose another user's cached data.

## A4. Logical Application Isolation

Each hosted logical application shall have a stable application identity and release identity. Requests and persisted records must carry sufficient context to distinguish application and release.

At minimum, application-scoped operations shall include `app_id`; release-specific operations shall also include `release_id` or an equivalent immutable release identifier.

A failure, update, or degraded state in one logical application must not make the Collaboration gallery or unrelated logical applications unavailable unless the underlying Databricks App runtime itself is unhealthy.

## A5. Shared Persistence and Write Safety

Durable collaboration data shall use governed shared persistence rather than process memory or local runtime files.

The persistence layer must safely support concurrent writes for:

- Feedback submissions
- Feedback dispositions
- Review-request status
- Reviewer activity
- User preferences
- Catalog/release administrative changes
- Audit events

Each durable record must use a unique identifier. Writes that update existing records must use an appropriate concurrency strategy such as transactional semantics, version checks, idempotency keys, or equivalent safeguards where lost updates are possible.

Feedback creation should be append-oriented whenever practical.

## A6. Shared Compute Boundary

The logical applications in Collaboration share the capacity of the underlying Databricks App runtime. The implementation must therefore:

- Avoid blocking the Node.js event loop with long-running CPU work.
- Offload expensive or long-running work to appropriate Databricks resources when practical.
- Bound request duration and external integration calls with timeouts.
- Use connection/resource pooling responsibly.
- Prevent one logical application's workload from monopolizing the shared host.
- Degrade gracefully when a dependency is slow or unavailable.
- Preserve the Collaboration shell and unrelated launch tiles whenever possible.

The UI must distinguish **logical application availability** from **shared host health**.

## A7. Multi-User Feedback Behavior

Feedback is inherently collaborative and must remain correct under simultaneous use.

Every feedback record shall be attributable to:

- Authenticated reviewer
- Logical application
- Release/version
- Optional feedback request or feature
- Category
- Comment and optional rating/sentiment
- Timestamp
- Disposition/status

Aggregate reviewer and feedback counts may be eventually consistent, but individual submitted feedback must not be silently lost or attributed to another user.

Duplicate form submissions caused by retries or double-clicks should be prevented or safely deduplicated.

## A8. Presence and Activity

Real-time presence is optional for MVP. The system may display reviewer counts, recent activity, or "active now" indicators only when backed by reliable data.

Do not imply live presence from historical activity alone.

The initial implementation should prioritize durable asynchronous collaboration over chat-like real-time features.

## A9. Administrative Concurrency

Administrative changes must not corrupt active reviewer sessions.

- Catalog and release changes must be atomic from the reviewer's perspective.
- Removing or disabling an application must produce a graceful unavailable state for users already on the gallery.
- A release replacement must not cause feedback intended for the prior release to be reassigned to the new release.
- Review requests must retain immutable linkage to their intended release.
- Administrative mutations must generate audit events.

## A10. Observability

Operational telemetry should make concurrent behavior diagnosable without exposing sensitive user content.

Minimum operational signals should include:

- Request rate and error rate
- Request latency
- Active/available logical applications
- Shared host health
- Dependency failures/timeouts
- Feedback write failures
- Authentication/authorization failures
- Resource pressure indicators available from the platform

Logs must include correlation/request identifiers and application/release context where appropriate. Avoid logging secrets or full sensitive feedback bodies by default.

## A11. Graceful Degradation

The shared host must fail as locally as possible.

Examples:

- GitHub/GitLab metadata unavailable → preserve launch capability and show metadata as temporarily unavailable.
- Feedback summary query fails → preserve gallery/launch capability and show feedback metrics as unavailable.
- One logical preview is updating → disable only that preview's launch action.
- Persistence write fails → clearly inform the submitting user; never falsely report successful feedback submission.
- Shared host resource pressure → preserve navigation and communicate degraded service rather than presenting a blank screen.

## A12. Security Boundary

All logical applications hosted inside Collaboration share the Collaboration Databricks App security/runtime boundary unless explicitly isolated elsewhere.

Therefore:

- Do not assume logical modules have independent Databricks service principals merely because they appear as separate applications in the UI.
- Grant the Collaboration App only the resources required for non-production collaboration.
- Do not expose production credentials or broad production data access to enable preview convenience.
- Application-level authorization may further restrict logical modules, but it does not replace the underlying shared-host security boundary.

## A13. Concurrency Acceptance Tests

Before the Collaboration Space is considered production-ready for its Bronze environment, automated or repeatable tests must demonstrate at least:

1. Two or more authenticated test users can use the Collaboration Space concurrently without state leakage.
2. Users can launch different logical applications concurrently.
3. Users can launch the same logical application concurrently.
4. Concurrent feedback submissions persist with correct user, application, and release attribution.
5. One logical application's unavailable/updating state does not prevent launch of another healthy logical application.
6. User preferences remain isolated between users.
7. Non-admin users cannot perform administrative mutations even under direct API invocation.
8. A concurrent release/catalog update does not reassign existing feedback to a different release.
9. Duplicate feedback submission is prevented or safely deduplicated.
10. A dependency timeout or failure does not blank or crash the entire Collaboration experience.

## A14. Load Validation

Because expected Collaboration usage is limited and asynchronous, the goal is not internet-scale load testing. The goal is to validate realistic overlapping use and identify the shared host's practical capacity.

Before operational use, establish and record a baseline test profile containing:

- Expected normal concurrent reviewers
- Expected peak concurrent reviewers
- Number of logical applications represented
- Representative launch/navigation rate
- Representative feedback submission rate
- Observed latency/error rate
- Shared runtime resource behavior

Do not encode an unsupported fixed concurrency number into the product contract. Establish the supported operating envelope empirically for the selected Databricks App compute/runtime configuration and revisit it when the hosted application mix changes materially.

## A15. Definition of Done

This addendum is satisfied when Collaboration Space behaves as a true shared multi-user environment: authenticated users can concurrently interact with the gallery and logical preview applications; user/session state remains isolated; durable writes remain correctly attributed and concurrency-safe; failures are localized; shared-host resource pressure is observable; and no component assumes a single active user or a single active logical application.

**Priority when concurrency tradeoffs arise:** security and isolation → data correctness → availability of unrelated logical applications → user experience → implementation convenience.
