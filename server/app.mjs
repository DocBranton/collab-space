import { createServer } from "node:http";
import { actorFromRequestHeaders } from "./identity.mjs";
import { ConflictError } from "./services/persistence.mjs";

export function createCollaborationApp(options) {
  return createServer(async (req, res) => {
    try { await route(options.store, req, res); }
    catch (error) {
      const status = error instanceof ConflictError ? 409 : error.status ?? 500;
      send(res, status, { error: error.message || "Request failed" });
    }
  });
}

async function route(store, req, res) {
  const url = new URL(req.url || "/", "http://collab.local");
  const path = url.pathname;
  res.setHeader("x-request-id", req.headers["x-request-id"] || crypto.randomUUID());
  if (req.method === "GET" && path === "/api/health") return send(res, 200, { status: "ok" });
  if (req.method === "GET" && path === "/api/me") {
    const actor = actorFromRequestHeaders(req.headers);
    return send(res, 200, { ...actor, canAdmin: actor.role === "admin" });
  }
  if (req.method === "GET" && path === "/api/collaboration/apps") {
    return send(res, 200, { host: { healthy: true }, source: { provider: "github", available: false }, apps: await store.gallery() });
  }
  if (req.method === "GET" && path.startsWith("/api/collaboration/apps/")) {
    const card = await store.app(path.split("/").pop());
    if (!card) return send(res, 404, { error: "Application not found" });
    return send(res, 200, card);
  }
  if (req.method === "GET" && path === "/api/collaboration/feedback-requests") {
    const actor = actorFromRequestHeaders(req.headers);
    return send(res, 200, await store.requests(url.searchParams.get("scope") === "all" ? "all" : "mine", actor.id));
  }
  if (req.method === "POST" && path === "/api/collaboration/feedback") {
    const actor = actorFromRequestHeaders(req.headers);
    const body = await readJson(req);
    if (!body.appId || !body.releaseId || !body.category || !body.comment || !body.idempotencyKey) return send(res, 400, { error: "appId, releaseId, category, comment, and idempotencyKey are required" });
    return send(res, 201, await store.createFeedback(body, actor));
  }
  if (req.method === "GET" && path === "/api/collaboration/activity") return send(res, 200, await store.activityFor(actorFromRequestHeaders(req.headers).id));
  if (req.method === "GET" && path === "/api/collaboration/preferences") return send(res, 200, await store.preferences(actorFromRequestHeaders(req.headers).id));
  if (req.method === "PUT" && path === "/api/collaboration/preferences") {
    const actor = actorFromRequestHeaders(req.headers);
    const body = await readJson(req);
    return send(res, 200, await store.updatePreferences(actor.id, { galleryView: body.galleryView, sortMode: body.sortMode }, Number(body.versionNo)));
  }
  if (req.method === "POST" && path.startsWith("/api/admin/releases/") && path.endsWith("/replace")) {
    const actor = actorFromRequestHeaders(req.headers);
    if (actor.role !== "admin") return send(res, 403, { error: "Admin role required" });
    const body = await readJson(req);
    await store.replaceRelease(actor, path.split("/")[4], Number(body.versionNo), String(body.version || ""));
    return send(res, 200, { ok: true });
  }
  send(res, 404, { error: "Not found" });
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}));
    req.on("error", reject);
  });
}
