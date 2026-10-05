import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createCollaborationApp } from "../server/app.mjs";
import { FilePersistence } from "../server/services/persistence.mjs";

test("gallery shell paints and cards come from the API", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "collab-ui-"));
  const store = await FilePersistence.open(path.join(dir, "data.json"));
  const server = createCollaborationApp({ store }).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const html = await fetch(`${base}/`).then((r) => r.text());
  assert.equal(html.includes("COLLABORATION SPACE"), true);
  assert.equal(html.includes("DATABRICKS APP COMMAND"), true);
  const apps = await fetch(`${base}/api/collaboration/apps`).then((r) => r.json());
  assert.equal(apps.apps.length, 5);
  assert.equal(apps.host.healthy, true);
  await new Promise((resolve) => server.close(resolve));
});
