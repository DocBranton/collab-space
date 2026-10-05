import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}

export function seedState() {
  return {
    applications: [
      { id: "eng", slug: "engineering-workbench", name: "Engineering Workbench", subtitle: "Drawing to CAD · Analysis · 3D Visualization", icon: "wing", owner: "Engineering", prodUrl: "/prod/engineering", sortOrder: 1, active: true, versionNo: 1 },
      { id: "gmw", slug: "global-mission-workbench", name: "Global Mission Workbench", subtitle: "Mission · Portfolio · Opportunities", icon: "wing", owner: "Mission", prodUrl: "/prod/gmw", sortOrder: 2, active: true, versionNo: 1 },
      { id: "req", slug: "requirements-workbench", name: "Requirements Workbench", subtitle: "SysML · Airworthiness · Verification", icon: "tri", owner: "Requirements", prodUrl: "/prod/requirements", sortOrder: 3, active: true, versionNo: 1 },
      { id: "inn", slug: "innovation-hub", name: "Innovation Hub", subtitle: "AM Solutions · Materials · Design Guides", icon: "atom", owner: "Innovation", prodUrl: "/prod/innovation", sortOrder: 4, active: true, versionNo: 1 },
      { id: "data", slug: "data-analytics", name: "Data & Analytics", subtitle: "Readiness · Supply Chain · AI Insights", icon: "chart", owner: "Analytics", prodUrl: "/prod/analytics", sortOrder: 5, active: true, versionNo: 1 },
    ],
    releases: [
      rel("rel-eng", "eng", "v0.4.2-collab", "available", "/preview/engineering", ["Enhanced CAD viewer with assembly support", "AI-assisted requirements extraction", "Improved 3D model visualization (STEP/GLB)"], "2026-09-27T15:00:00Z"),
      rel("rel-gmw", "gmw", "v1.4.0-collab", "available", "/preview/mission", ["New Opportunity workflow and filters", "Enhanced Portfolio visualization", "Integrated manufacturing capability view"], "2026-09-26T15:00:00Z"),
      rel("rel-req", "req", "v0.7.1-collab", "available", "/preview/requirements", ["New airworthiness requirement views", "Traceability and verification visualization", "MIL-STD-810H overlay"], "2026-09-25T15:00:00Z"),
      rel("rel-inn", "inn", "v1.1.0-collab", "available", "/preview/innovation", ["New AM design guides and case studies", "Expanded materials database", "Improved search and filtering"], "2026-09-24T15:00:00Z"),
      rel("rel-data", "data", "v1.2.0-collab", "updating", "/preview/analytics", ["New readiness and supply chain dashboards", "AI-powered insights and forecasting"], "2026-09-24T15:00:00Z", "2026-09-28"),
    ],
    feedbackRequests: [
      { id: "ask-req", appId: "req", releaseId: "rel-req", title: "Airworthiness views", instructions: "Exercise the MIL-STD-810H overlay and confirm traceability is readable.", dueAt: "2026-09-30", status: "open", audience: "functional reviewers", versionNo: 1 },
    ],
    feedback: [],
    activity: [],
    preferences: [],
    audit: [],
  };
}

function rel(id, appId, version, status, launchRoute, changes, releasedAt, expectedAt) {
  return { id, appId, version, branch: "collab", commitSha: id, status, launchRoute, previewAsset: `/previews/${appId}.jpg`, releasedAt, expectedAt, versionNo: 1, changes: changes.map((changeText, ordinal) => ({ ordinal: ordinal + 1, changeText })) };
}

export class FilePersistence {
  constructor(filePath, initial) {
    this.filePath = filePath;
    this.state = initial ?? seedState();
    this.chain = Promise.resolve();
  }
  static async open(filePath) {
    try { return new FilePersistence(filePath, JSON.parse(await readFile(filePath, "utf8"))); }
    catch { const store = new FilePersistence(filePath, seedState()); await store.persist(); return store; }
  }
  async persist() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(this.state));
    await rename(tmp, this.filePath);
  }
  async txn(fn) {
    let result;
    const run = this.chain.then(async () => { result = fn(this.state); await this.persist(); });
    this.chain = run.then(() => undefined, () => undefined);
    await run;
    return result;
  }
  gallery() { return this.txn((state) => projectGallery(state)); }
  async app(id) { return (await this.gallery()).find((card) => card.id === id) ?? null; }
  createFeedback(input, actor) {
    return this.txn((state) => {
      const existing = state.feedback.find((row) => row.userId === actor.id && row.idempotencyKey === input.idempotencyKey);
      if (existing) return existing;
      const release = state.releases.find((row) => row.id === input.releaseId && row.appId === input.appId);
      if (!release) throw new ConflictError("Release is not current for that application");
      const record = { id: randomUUID(), requestId: input.requestId, appId: input.appId, releaseId: input.releaseId, userId: actor.id, category: input.category, rating: input.rating, comment: input.comment, createdAt: new Date().toISOString(), disposition: "open", idempotencyKey: input.idempotencyKey };
      state.feedback.push(record);
      state.activity.push({ id: randomUUID(), userId: actor.id, appId: input.appId, releaseId: input.releaseId, action: "feedback_submitted", occurredAt: record.createdAt, metadata: { category: input.category } });
      state.audit.push({ id: randomUUID(), actorId: actor.id, action: "feedback.create", entity: "feedback", entityId: record.id, occurredAt: record.createdAt, metadata: { releaseId: input.releaseId } });
      return record;
    });
  }
  activityFor(userId) { return this.txn((state) => state.activity.filter((row) => row.userId === userId)); }
  requests(scope, userId) {
    return this.txn((state) => {
      const open = state.feedbackRequests.filter((row) => row.status === "open");
      if (scope === "all") return open;
      const touched = new Set(state.activity.filter((row) => row.userId === userId).map((row) => row.appId));
      return open.filter((row) => touched.has(row.appId) || row.audience === "functional reviewers");
    });
  }
  preferences(userId) { return this.txn((state) => ensurePrefs(state, userId)); }
  updatePreferences(userId, patch, versionNo) {
    return this.txn((state) => {
      const prefs = ensurePrefs(state, userId);
      if (prefs.versionNo !== versionNo) throw new ConflictError("Preferences were updated by another request");
      Object.assign(prefs, patch, { userId, versionNo: prefs.versionNo + 1 });
      return prefs;
    });
  }
  replaceRelease(actor, releaseId, versionNo, nextVersion) {
    if (actor.role !== "admin") throw Object.assign(new Error("Admin role required"), { status: 403 });
    return this.txn((state) => {
      const release = state.releases.find((row) => row.id === releaseId);
      if (!release) throw new ConflictError("Release not found");
      if (release.versionNo !== versionNo) throw new ConflictError("Release version conflict");
      const priorId = release.id;
      release.id = randomUUID();
      release.version = nextVersion;
      release.versionNo += 1;
      release.releasedAt = new Date().toISOString();
      state.audit.push({ id: randomUUID(), actorId: actor.id, action: "release.replace", entity: "collab_releases", entityId: release.id, occurredAt: release.releasedAt, metadata: { priorReleaseId: priorId } });
    });
  }
  feedbackForRelease(releaseId) { return this.txn((state) => state.feedback.filter((row) => row.releaseId === releaseId)); }
}

function ensurePrefs(state, userId) {
  let prefs = state.preferences.find((row) => row.userId === userId);
  if (!prefs) {
    prefs = { userId, galleryView: "grid", sortMode: "featured", dismissedItems: [], versionNo: 1 };
    state.preferences.push(prefs);
  }
  return prefs;
}

function projectGallery(state) {
  return state.applications.filter((app) => app.active).sort((a, b) => a.sortOrder - b.sortOrder).map((app) => {
    const release = state.releases.find((row) => row.appId === app.id);
    if (!release) throw new ConflictError(`No release for ${app.id}`);
    const comments = state.feedback.filter((row) => row.releaseId === release.id);
    const ask = state.feedbackRequests.find((row) => row.releaseId === release.id && row.status === "open");
    return {
      id: app.id, name: app.name, subtitle: app.subtitle, icon: app.icon, version: release.version, releaseId: release.id,
      status: release.status, launchRoute: release.status === "available" ? release.launchRoute : "", previewAsset: release.previewAsset,
      expectedAt: release.expectedAt, changes: release.changes.map((row) => row.changeText), feedbackRequested: Boolean(ask),
      reviewers: new Set(comments.map((row) => row.userId)).size, comments: comments.length, updated: release.releasedAt.slice(0, 10), hostHealthy: true,
    };
  });
}
