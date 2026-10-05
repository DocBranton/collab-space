# Collaboration Space Development Contract

**Product:** Databricks App Command & Control — Collaboration Space  
**Environment:** WDP Slot 1 — Bronze Collaboration  
**Target:** Databricks App using Databricks AppKit  
**Lifecycle:** Off-network Development → Collaboration → TEST/UAT → Release Gate → Production

> **GOLDEN RULE:** The approved Collaboration Space concept is the visual and behavioral contract. Implementation should look and feel like the concept—not merely contain the same information.

> **MANDATORY ADDENDUM:** [`Addendum A — Multi-User Concurrency & Session Isolation`](ADDENDUM_A_MULTI_USER_CONCURRENCY.md) is incorporated into this contract by reference. Collaboration Space shall support concurrent authenticated users across multiple logical hosted applications with user-isolated state, governed shared persistence, concurrency-safe writes, localized failure behavior, and no single-active-user or single-active-application assumption.

## 1. Product Intent

Collaboration Space is the functional-review front door for emerging applications before formal TEST/UAT. Development may occur off-network; Collaboration provides an accessible WDP-hosted experience where functional users can launch preview builds, understand what changed, exercise workflows, and provide version-specific feedback.

The experience should resemble an internal capability gallery or app store rather than a DevOps console. Technical deployment detail may be available when needed, but it must not dominate the functional-review experience.

## 2. Non-Negotiable Product Principles

1. **Visual fidelity first.** Preserve the approved panoramic composition, hierarchy, spacing, card density, typography, bronze Collaboration identity, navy command shell, and screenshot-led application tiles.
2. **One physical slot, multiple logical applications.** One Collaboration Databricks App slot may represent multiple logical preview applications. The UI must clearly distinguish WDP physical slot capacity from logical applications presented in Collaboration.
3. **Asynchronous by design.** Applications may be available, updating, unavailable, scheduled, or awaiting feedback without implying that all modules are continuously active.
4. **Functional simplicity.** Reviewers should immediately answer: What can I try? What changed? What feedback is requested? How do I launch it? How do I respond?
5. **Traceability.** Feedback is attributable to application, release/version, optional feature/review request, reviewer, timestamp, and disposition.
6. **Explicit promotion.** Collaboration acceptance does not equal production authorization. Accepted candidates move to the separate TEST/UAT lifecycle.
7. **Multi-user by design.** Multiple authenticated users may concurrently use the Collaboration Space and its logical applications. User/session state must remain isolated and durable writes must remain correctly attributed.

## 3. Target Technology Contract

| Layer | Required direction | Contract |
|---|---|---|
| Runtime | Databricks Apps | Deploy as a custom Databricks App with `app.yaml` and workspace-managed identity/resources. |
| Framework | Databricks AppKit | Use AppKit as the application foundation and follow its Node.js/React patterns. |
| Client | React + TypeScript | Strict TypeScript; componentized UI; desktop-first at 3440×1440 with graceful scaling to standard desktop widths. |
| Server | Node.js + Express | API façade for catalog, feedback, activity, review requests, user context, and integration adapters. |
| Styling | CSS design system | Reusable tokens for navy shell, Bronze Collaboration, Silver TEST, Gold PROD, status colors, spacing, radii, typography, and shadows. |
| Persistence | Unity Catalog governed store | Persist catalog metadata, feedback, review requests, activity, and preferences outside local runtime state. |
| Identity | Databricks authentication | Use signed-in Databricks user context; do not create a parallel username/password system. |
| Source integration | Provider adapters | GitHub and GitLab must fit behind a source-provider abstraction. |

Durable review state must not depend on local disk or in-memory runtime state.

## 4. Screen Contract — Collaboration Space

The primary route is the Collaboration gallery. At 3440×1440 it should preserve the concept's panoramic hierarchy.

### 4.1 Global Command Header

- Brand: **DATABRICKS APP COMMAND & CONTROL**.
- Subline: **Build · Test · Deploy · Monitor · Govern**.
- Primary navigation: Command Center, Applications, Environments, Deployments, Testing, Releases, Insights.
- Global search for applications, deployments, or logs.
- Help/notification affordances and signed-in user/profile area.

### 4.2 Left Navigation

Primary operations:
- Command Center
- Applications
- Environments
- Deployments
- Testing & Quality
- Releases
- Security & Compliance
- Monitoring & Observability
- Reports & Analytics

Configuration:
- App Catalog
- Environment Settings
- Access & Roles
- Webhooks & Notifications
- Integrations
- Audit Log

Navigation is permission-aware. Functional reviewers may see a simplified subset; administrators may see the full command surface.

### 4.3 WDP Slot Ribbon

The seven-slot model must always be understandable:

- **Slot 1 — Collaboration — Bronze** — shared environment, logical application count, health.
- **Slot 2 — TEST/UAT — Silver** — shared environment, active candidate count, UAT/Cyber review.
- **Slots 3–7 — Production — Gold** — five dedicated production applications.

The ribbon is actionable. Collaboration opens this gallery; TEST/UAT opens the validation space; production tiles launch their production applications.

### 4.4 Collaboration Hero

Required content:

- **COLLABORATION SPACE**
- **BRONZE ENVIRONMENT** badge
- Purpose: **Explore emerging capabilities · Experience new features · Provide feedback · Shape what gets fielded.**
- Lifecycle cue: **INNOVATE → COLLABORATE → VALIDATE → FIELD**

Use restrained aviation/mission imagery consistent with the approved concept. Text legibility takes precedence over decorative treatment.

### 4.5 Gallery Controls

- Tabs: **All Applications**, **My Activity**, **Feedback Requests**.
- Count badges where meaningful.
- Search applications.
- Status filter.
- Sort; default **Featured**.
- Grid/list toggle.
- Default ranking prioritizes active feedback requests, then recently updated available previews.

## 5. Application Launch Tile Contract

Each logical application is represented by a large visual card. The application screenshot/preview should occupy approximately 55–65% of the card's visual area.

| Element | Required behavior |
|---|---|
| Identity | Application icon, name, concise capability subtitle. |
| Preview image | Current representative UI screenshot; use optimized static asset/generated thumbnail and never block the card waiting for a live capture. |
| Version | Collaboration version such as `v0.4.2-collab`; optional branch/commit appears in details. |
| State | Available, Feedback Requested, Updating, Unavailable, or Scheduled. State controls the primary action. |
| What's New | 2–4 concise release-specific changes; no generic marketing copy. |
| Review signal | Reviewer count, comment/feedback count, last updated; optional due date or targeted review callout. |
| Primary action | **Launch Preview** when available. |
| Secondary action | **Provide Feedback** with application/version preselected. |
| Updating state | Disable Launch Preview, explain expected availability if known, expose **View Update Status**. |
| Details | Release metadata, repository/branch/commit, owner, activity, history, and technical detail without cluttering the default card. |

## 6. Five-Application Reference State

The initial implementation should be seeded with five configurable entries matching the concept. These are configuration/data, not hard-coded layout assumptions.

1. **Engineering Workbench** — Drawing to CAD · Analysis · 3D Visualization — Available.
2. **Global Mission Workbench** — Mission · Portfolio · Opportunities — Available.
3. **Requirements Workbench** — SysML · Airworthiness · Verification — Feedback Requested.
4. **Innovation Hub** — AM Solutions · Materials · Design Guides — Available.
5. **Data & Analytics** — Readiness · Supply Chain · AI Insights — Updating/Unavailable reference state to prove graceful degraded behavior.

## 7. Functional Behavior

- On load, retrieve current user, application catalog, current Collaboration release metadata, review requests, feedback summary, and availability status.
- Card launch preserves selected logical application identity and version.
- If previews are modules inside the Collaboration host, use stable routes; if an approved preview is external, use a controlled launch URL.
- Feedback supports general and feature-specific input.
- Minimum feedback context: app ID, release ID, optional review request/feature, category, comment, optional rating/sentiment, trusted user identity, timestamp.
- **Feedback Requests** shows targeted asks, instructions, due date, target audience, completion state, and direct launch action.
- **My Activity** shows the signed-in user's previews, feedback submissions, and open requests; it is not a developer commit history.
- Application availability is data-driven. Failure/updating state of one logical app must not degrade the gallery.
- Admin users can manage catalog entries, releases, What's New, feedback requests, preview assets, display order, and launch routing without editing React source.
- Concurrent user and logical-application behavior must conform to Addendum A.

## 8. Minimum Data Model

| Entity | Key fields | Purpose |
|---|---|---|
| `applications` | id, slug, name, subtitle, icon, owner, prod_url, sort_order, active | Logical product catalog. |
| `collab_releases` | id, app_id, version, branch, commit_sha, status, launch_route, preview_asset, released_at | Current showcased Collaboration release. |
| `release_changes` | release_id, ordinal, change_text | What's New bullets. |
| `feedback_requests` | id, app_id, release_id, title, instructions, due_at, status, audience | Targeted functional review. |
| `feedback` | id, request_id?, app_id, release_id, user_id, category, rating?, comment, created_at, disposition | Traceable reviewer input. |
| `review_activity` | id, user_id, app_id, release_id, action, occurred_at, metadata | My Activity and aggregate activity. |
| `user_preferences` | user_id, gallery_view, sort_mode, dismissed_items | Persisted lightweight UX preferences. |

## 9. MVP API Contract

- `GET /api/me` — signed-in user and role/capability flags.
- `GET /api/collaboration/apps` — presentation-ready gallery model with release, availability, counts, and feedback request summary.
- `GET /api/collaboration/apps/:id` — application/release detail.
- `GET /api/collaboration/feedback-requests?scope=mine|all` — review requests.
- `POST /api/collaboration/feedback` — create feedback; server supplies trusted user identity.
- `GET /api/collaboration/activity?scope=mine` — reviewer activity.
- Admin create/update endpoints for application, release, and feedback-request entities protected by server-side role checks.
- `GET /api/health` — lightweight health endpoint; no secrets or privileged platform detail.

## 10. Preferred Repository Shape

```text
app.yaml
package.json
server/
  index.ts
  routes/
    collaboration.ts
    feedback.ts
    admin.ts
  services/
    catalog.ts
    persistence.ts
    sourceProvider.ts
client/
  src/
    App.tsx
    routes/
      CollaborationSpace.tsx
      MyActivity.tsx
      FeedbackRequests.tsx
    components/
      SlotRibbon.tsx
      CollaborationHero.tsx
      AppLaunchCard.tsx
      FeedbackDialog.tsx
      StatusBadge.tsx
    design/
      tokens.css
    api/
      client.ts
    types/
      collaboration.ts
public/
  previews/
tests/
  unit/
  integration/
```

Adapt this structure to the generated/current AppKit template rather than fighting framework conventions.

## 11. Visual Design Contract

- **Primary target canvas: 3440×1440.** The experience must remain coherent at 1920×1080. Mobile is not a primary acceptance target.
- Dark navy command shell; white/light content surface.
- **Bronze** uniquely identifies Collaboration.
- **Silver** is reserved for TEST/UAT.
- **Gold** is reserved for Production.
- Use generous horizontal space; do not collapse the concept into a narrow conventional admin dashboard.
- Cards use subtle borders/shadows, consistent radii, crisp preview crops, and restrained effects.
- Strong title hierarchy, compact metadata, legible body text.
- Use a consistent icon family; no emoji as production UI icons.
- Motion is subtle and functional only.
- Keyboard navigation, visible focus, semantic controls, sufficient contrast, and meaningful alt text are required.

## 12. Security and Governance Contract

- Use Databricks identity and authorization.
- Enforce authorization server-side for administrative mutations.
- Collaboration is non-production; do not expose production secrets or grant broad production resource access because production launch tiles are visible.
- Persist durable state in governed Databricks resources.
- Never place GitHub/GitLab tokens, Databricks PATs, secrets, or privileged URLs in client bundles.
- Record audit-relevant actions: catalog changes, release changes, feedback-request creation/closure, and feedback disposition.
- Source-provider integration must remain adapter-based so GitHub and GitLab can coexist without changing the gallery contract.
- Multi-user identity, isolation, and shared security-boundary requirements are governed by Addendum A.

## 13. Performance Contract

- Initial shell paints immediately; never hold the entire page blank while application metadata loads.
- Use skeletons only within unresolved cards/sections.
- A 10–15 second blank-card or blank-page experience is unacceptable.
- Optimize preview images and lazy-load below-the-fold assets.
- Gallery API returns a presentation-ready aggregate to avoid N+1 client requests.
- Failure of repository, telemetry, or optional integration data must not prevent launch of an otherwise available preview.
- Performance under overlapping multi-user use must be validated according to Addendum A rather than assumed from single-user testing.

## 14. MVP Boundary

### Must Have

- Command shell, seven-slot ribbon, Collaboration hero, five visual application cards.
- All Applications / My Activity / Feedback Requests tabs.
- Search, status filter, sort, and grid/list affordance.
- Available / Feedback Requested / Updating states.
- Launch Preview and Provide Feedback flows.
- Persisted catalog, releases, What's New, feedback requests, and feedback.
- Databricks user context and role-aware admin capability.
- Desktop-responsive behavior.
- Seed/demo data matching the concept without hard-coding the system to exactly five applications.
- Concurrent authenticated-user support and session isolation as defined by Addendum A.

### Post-MVP

- Automated GitHub/GitLab release metadata ingestion and webhooks.
- Teams notifications and richer workflow integration.
- AI assistant for feedback summarization, theme clustering, release-note drafting, and unresolved review concerns.
- Automated promotion handoff to TEST/UAT and Release Evidence Package linkage.
- Advanced telemetry, usage analytics, and reviewer engagement metrics.

## 15. Acceptance Criteria

| Area | Definition of done |
|---|---|
| Visual fidelity | At 3440×1440, side-by-side comparison is recognizably the approved concept: same hierarchy, panoramic layout, Bronze identity, five screenshot-led tiles, and slot ribbon. |
| Functional launch | Every Available tile launches its configured preview; unavailable/updating states cannot accidentally launch stale targets. |
| Feedback | Reviewer can submit contextual feedback in no more than three interactions from the gallery; feedback persists and reappears in counts/activity. |
| Review requests | Targeted requests are visually prominent and traceable to a specific release. |
| Asynchronous behavior | One logical app may update or be unavailable without degrading the rest of the gallery. |
| Identity | Signed-in Databricks identity is used for reviewer attribution. |
| Persistence | Restart/redeploy does not erase catalog, feedback, or activity. |
| Authorization | Non-admin users cannot mutate catalog/release configuration through direct API calls. |
| Multi-user concurrency | Multiple authenticated users can concurrently use the gallery and logical applications without user/session state leakage or incorrect data attribution; Addendum A acceptance tests pass. |
| Performance | No blank whole-page wait; shell and known/cached content render progressively. |
| Extensibility | Adding a sixth logical application requires data/configuration, not a new page layout or new Databricks App slot. |
| Testing | Unit tests cover gallery transformations and permissions; integration tests cover feedback creation and catalog API; key UI flows have browser-level tests. |
| Production readiness | Strict-TypeScript clean; no console errors on normal paths; health endpoint succeeds; secrets remain server-side. |

## 16. Implementation Sequence

1. **Foundation** — initialize/align AppKit project; establish shell, routes, design tokens, user context, and persistence adapter.
2. **Static fidelity** — reproduce the approved Collaboration screen with seeded data before wiring integrations.
3. **Catalog** — make all cards data-driven; implement states, search/filter/sort, and stable launch routing.
4. **Feedback** — implement requests, submission, My Activity, and reviewer counts.
5. **Concurrency foundation** — verify request-scoped identity, user-state isolation, concurrency-safe persistence, logical-app isolation, and failure localization per Addendum A.
6. **Administration** — role-protected catalog/release/request management.
7. **Integrations** — add source-provider metadata adapters; do not block MVP on GitHub/GitLab automation.
8. **Hardening** — tests, accessibility, failure states, performance, audit events, concurrency/load validation, and deployment configuration.
9. **Visual acceptance** — capture the running app at 3440×1440 and compare directly against the approved concept before declaring complete.

## 17. Explicit Non-Goals

- Do not turn Collaboration Space into a general-purpose Git client, CI/CD console, or Databricks administration clone.
- Do not duplicate TEST/UAT evidence and release-gate workflows on the Collaboration landing page.
- Do not require every logical preview to consume its own Databricks App slot.
- Do not expose implementation complexity to functional reviewers.
- Do not make mobile parity a release blocker for the initial WDP deployment.
- Do not add AI merely for novelty; AI follows a reliable core review/feedback workflow.
- Do not optimize for internet-scale concurrency; validate the realistic WDP Collaboration operating envelope empirically as specified in Addendum A.

## 18. Definition of the Contract

A build conforms to this contract when it behaves as a functional, shared multi-user collaboration gallery; looks materially like the approved concept; runs as a secure Databricks AppKit application; supports multiple logical preview applications within the Collaboration experience; isolates concurrent user/session state; captures correctly attributed, concurrency-safe asynchronous feedback; and hands accepted candidates forward to the separate TEST/UAT lifecycle.

**Priority when implementation choices conflict:** security and correctness → faithful user workflow → visual fidelity → maintainability → implementation convenience.
