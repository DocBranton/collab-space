import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createCollaborationApp } from "../server/app.mjs";
import { FilePersistence } from "../server/services/persistence.mjs";

async function harness() {
  const dir = await mkdtemp(path.join(tmpdir(), "collab-"));
  const store = await FilePersistence.open(path.join(dir, "data.json"));
  const server = createCollaborationApp({ store }).listen(0);
  const address = server.address();
  return { base: `http://127.0.0.1:${address.port}`, store, close: () => new Promise((resolve) => server.close(resolve)) };
}
function asUser(email, init = {}) {
  return { ...init, headers: { "content-type": "application/json", "x-forwarded-email": email, ...(init.headers || {}) } };
}

test("concurrent feedback keeps user, app, and release attribution", async () => {
  const h = await harness();
  const apps = await fetch(`${h.base}/api/collaboration/apps`).then((r) => r.json());
  const eng = apps.apps.find((row) => row.id === "eng");
  const results = await Promise.all([
    fetch(`${h.base}/api/collaboration/feedback`, asUser("reviewer@example.mil", { method: "POST", body: JSON.stringify({ appId: eng.id, releaseId: eng.releaseId, category: "Usability", comment: "Reviewer note", idempotencyKey: "r1", userId: "spoofed" }) })),
    fetch(`${h.base}/api/collaboration/feedback`, asUser("owner@example.mil", { method: "POST", body: JSON.stringify({ appId: eng.id, releaseId: eng.releaseId, category: "Workflow gap", comment: "Owner note", idempotencyKey: "o1", userId: "spoofed" }) })),
  ]);
  assert.equal(results.every((r) => r.status === 201), true);
  const rows = await h.store.feedbackForRelease(eng.releaseId);
  assert.deepEqual(rows.map((row) => row.userId).sort(), ["user-owner", "user-reviewer"]);
  assert.equal(rows.every((row) => row.userId !== "spoofed"), true);
  await h.close();
});

test("duplicate submission is deduplicated and updating app does not hide others", async () => {
  const h = await harness();
  const apps = await fetch(`${h.base}/api/collaboration/apps`).then((r) => r.json());
  const req = apps.apps.find((row) => row.id === "req");
  const data = apps.apps.find((row) => row.id === "data");
  const body = JSON.stringify({ appId: req.id, releaseId: req.releaseId, category: "Defect", comment: "Same note", idempotencyKey: "dup-1" });
  const first = await fetch(`${h.base}/api/collaboration/feedback`, asUser("reviewer@example.mil", { method: "POST", body }));
  const second = await fetch(`${h.base}/api/collaboration/feedback`, asUser("reviewer@example.mil", { method: "POST", body }));
  assert.equal((await first.json()).id, (await second.json()).id);
  assert.equal(data.status, "updating");
  assert.equal(data.launchRoute, "");
  assert.equal(req.launchRoute.length > 0, true);
  await h.close();
});

test("preferences stay isolated and a release replace does not move feedback", async () => {
  const h = await harness();
  const apps = await fetch(`${h.base}/api/collaboration/apps`).then((r) => r.json());
  const eng = apps.apps.find((row) => row.id === "eng");
  await fetch(`${h.base}/api/collaboration/feedback`, asUser("reviewer@example.mil", { method: "POST", body: JSON.stringify({ appId: eng.id, releaseId: eng.releaseId, category: "Usability", comment: "Keep me", idempotencyKey: "keep" }) }));
  await fetch(`${h.base}/api/collaboration/preferences`, asUser("reviewer@example.mil", { method: "PUT", body: JSON.stringify({ versionNo: 1, galleryView: "list" }) }));
  await fetch(`${h.base}/api/collaboration/preferences`, asUser("owner@example.mil", { method: "PUT", body: JSON.stringify({ versionNo: 1, galleryView: "grid" }) }));
  assert.equal((await fetch(`${h.base}/api/collaboration/preferences`, asUser("reviewer@example.mil")).then((r) => r.json())).galleryView, "list");
  assert.equal((await fetch(`${h.base}/api/collaboration/preferences`, asUser("owner@example.mil")).then((r) => r.json())).galleryView, "grid");
  const replaced = await fetch(`${h.base}/api/admin/releases/${eng.releaseId}/replace`, asUser("david.branton@example.mil", { method: "POST", body: JSON.stringify({ versionNo: 1, version: "v0.4.3-collab" }) }));
  assert.equal(replaced.status, 200);
  const still = await h.store.feedbackForRelease(eng.releaseId);
  assert.equal(still.length, 1);
  assert.equal(still[0].comment, "Keep me");
  await h.close();
});
