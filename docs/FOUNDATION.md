# Foundation

Sequence steps 1 and the Express mount are in `server/`.

- `npm start` and `npm run dev` serve the gallery through Express.
- `npm run start:appkit` loads `@databricks/appkit` `createApp` and registers `collaborationPlugin`, which injects the same routes. AppKit is an optional dependency until `databricks apps init` aligns the template.
- Identity comes from Databricks forwarded headers. A client-supplied `userId` is ignored.
- Durable state goes through `FilePersistence`, a version-checked file adapter standing in for Unity Catalog.
- Feedback is append-oriented and idempotent per user key. A release replace keeps prior feedback on the prior `release_id`.
- `/api/health` returns only `{ "status": "ok" }`.

`npm test` covers concurrent attribution, dedupe, preference isolation, release immutability, authorization, the gallery shell, and the Express mount.
