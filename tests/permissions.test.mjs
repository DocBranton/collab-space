import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createCollaborationApp } from "../server/app.mjs";
import { FilePersistence } from "../server/services/persistence.mjs";

test("non-admin cannot mutate a release through the API", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "collab-auth-"));
  const store = await FilePersistence.open(path.join(dir, "data.json"));
  const server = createCollaborationApp({ store }).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const apps = await fetch(`${base}/api/collaboration/apps`).then((r) => r.json());
  const denied = await fetch(`${base}/api/admin/releases/${apps.apps[0].releaseId}/replace`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-email": "reviewer@example.mil" },
    body: JSON.stringify({ versionNo: 1, version: "v9.9.9-collab" }),
  });
  assert.equal(denied.status, 403);
  assert.deepEqual(await fetch(`${base}/api/health`).then((r) => r.json()), { status: "ok" });
  await new Promise((resolve) => server.close(resolve));
});

test("missing Databricks identity is rejected", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "collab-id-"));
  const store = await FilePersistence.open(path.join(dir, "data.json"));
  const server = createCollaborationApp({ store }).listen(0);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/me`);
  assert.equal(response.status, 401);
  await new Promise((resolve) => server.close(resolve));
});
