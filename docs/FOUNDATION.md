# Foundation

Sequence step 1 is in `server/`. It does not use a process-global user or an in-memory catalog as the system of record.

- Identity comes from Databricks forwarded headers (`x-forwarded-email`, `x-databricks-user-email`). A client-supplied `userId` is ignored.
- Durable state goes through `FilePersistence`, a version-checked file adapter standing in for Unity Catalog until the workspace resource is bound. Writes are serialized and atomic.
- Feedback is append-oriented and idempotent per user key. A release replace keeps prior feedback on the prior `release_id`.
- `/api/health` returns only `{ "status": "ok" }`.
- Local check: `npm test`. Five Addendum A cases pass: concurrent attribution, dedupe, isolated preferences, release immutability, and non-admin rejection.

The runnable server is Node's HTTP module so the foundation can be verified without a package registry. AppKit `createApp` / Express mounting is the next alignment when `databricks apps init` is available.
