import { actorFromRequestHeaders } from "./identity.mjs";
import { ConflictError } from "./services/persistence.mjs";

export function registerCollaboration(app, store) {
  app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.get("/api/me", (req, res, next) => {
    try {
      const actor = actorFromRequestHeaders(req.headers);
      res.json({ ...actor, canAdmin: actor.role === "admin" });
    } catch (error) { next(error); }
  });
  app.get("/api/collaboration/apps", async (_req, res, next) => {
    try { res.json({ host: { healthy: true }, source: { provider: "github", available: false }, apps: await store.gallery() }); }
    catch (error) { next(error); }
  });
  app.get("/api/collaboration/apps/:id", async (req, res, next) => {
    try {
      const card = await store.app(req.params.id);
      if (!card) return res.status(404).json({ error: "Application not found" });
      res.json(card);
    } catch (error) { next(error); }
  });
  app.get("/api/collaboration/feedback-requests", async (req, res, next) => {
    try {
      const actor = actorFromRequestHeaders(req.headers);
      res.json(await store.requests(req.query.scope === "all" ? "all" : "mine", actor.id));
    } catch (error) { next(error); }
  });
  app.post("/api/collaboration/feedback", async (req, res, next) => {
    try {
      const actor = actorFromRequestHeaders(req.headers);
      const body = req.body ?? {};
      if (!body.appId || !body.releaseId || !body.category || !body.comment || !body.idempotencyKey) {
        return res.status(400).json({ error: "appId, releaseId, category, comment, and idempotencyKey are required" });
      }
      res.status(201).json(await store.createFeedback(body, actor));
    } catch (error) { next(error); }
  });
  app.get("/api/collaboration/activity", async (req, res, next) => {
    try { res.json(await store.activityFor(actorFromRequestHeaders(req.headers).id)); }
    catch (error) { next(error); }
  });
  app.get("/api/collaboration/preferences", async (req, res, next) => {
    try { res.json(await store.preferences(actorFromRequestHeaders(req.headers).id)); }
    catch (error) { next(error); }
  });
  app.put("/api/collaboration/preferences", async (req, res, next) => {
    try {
      const actor = actorFromRequestHeaders(req.headers);
      res.json(await store.updatePreferences(actor.id, { galleryView: req.body?.galleryView, sortMode: req.body?.sortMode }, Number(req.body?.versionNo)));
    } catch (error) { next(error); }
  });
  app.post("/api/admin/releases/:id/replace", async (req, res, next) => {
    try {
      const actor = actorFromRequestHeaders(req.headers);
      if (actor.role !== "admin") return res.status(403).json({ error: "Admin role required" });
      await store.replaceRelease(actor, req.params.id, Number(req.body?.versionNo), String(req.body?.version || ""));
      res.json({ ok: true });
    } catch (error) { next(error); }
  });
  app.use((error, _req, res, _next) => {
    const status = error instanceof ConflictError ? 409 : error.status ?? 500;
    res.status(status).json({ error: error.message || "Request failed" });
  });
}
