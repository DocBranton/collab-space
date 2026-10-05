import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createExpressApp } from "../server/expressApp.mjs";
import { FilePersistence } from "../server/services/persistence.mjs";

test("Express mount serves the gallery and ignores a client user id", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "collab-ex-"));
  const store = await FilePersistence.open(path.join(dir, "data.json"));
  const server = createExpressApp(store).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const html = await fetch(`${base}/`).then((r) => r.text());
  assert.equal(html.includes("COLLABORATION SPACE"), true);
  const apps = await fetch(`${base}/api/collaboration/apps`).then((r) => r.json());
  const eng = apps.apps.find((row) => row.id === "eng");
  const saved = await fetch(`${base}/api/collaboration/feedback`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-email": "reviewer@example.mil" },
    body: JSON.stringify({ appId: eng.id, releaseId: eng.releaseId, category: "Usability", comment: "Express path", idempotencyKey: "ex-1", userId: "spoofed" }),
  }).then((r) => r.json());
  assert.equal(saved.userId, "user-reviewer");
  await new Promise((resolve) => server.close(resolve));
});
