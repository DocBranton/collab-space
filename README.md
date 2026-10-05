# Collaboration Space

**Databricks App Command & Control — Bronze Collaboration Environment**

Collaboration Space is a Databricks AppKit application that provides a shared, asynchronous environment where functional users can explore emerging applications, experience new features, and provide version-specific feedback before candidates advance to TEST/UAT.

## Lifecycle

**Off-network Development → Collaboration → TEST/UAT → Release Gate → Production**

Within the WDP seven-slot model, Collaboration occupies one shared Databricks App slot, TEST/UAT occupies one shared slot, and five slots remain available for dedicated production applications.

## Development Contract

The implementation target is defined in [`docs/COLLABORATION_SPACE_DEVELOPMENT_CONTRACT.md`](docs/COLLABORATION_SPACE_DEVELOPMENT_CONTRACT.md).

Mandatory architectural addenda:

- [`Addendum A — Multi-User Concurrency & Session Isolation`](docs/ADDENDUM_A_MULTI_USER_CONCURRENCY.md) — establishes concurrent authenticated-user support, user/session isolation, concurrency-safe persistence, shared-compute behavior, graceful degradation, observability, and concurrency/load acceptance testing.

> The approved Collaboration Space concept is the visual and behavioral contract. Implementation should look and feel like the concept—not merely contain the same information.

> One Databricks App slot does not imply one user or one logical application at a time. Collaboration Space is a shared multi-user host.

## Target Stack

- Databricks Apps
- Databricks AppKit
- React + TypeScript
- Node.js + Express
- Unity Catalog governed persistence
- GitHub/GitLab source-provider adapters

## Primary Experience

The Collaboration landing page behaves like an internal capability gallery rather than a DevOps console. Large visual launch tiles show the current preview, version, availability, What's New, review activity, feedback requests, and actions to **Launch Preview** or **Provide Feedback**.
