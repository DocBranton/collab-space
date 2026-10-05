import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerCollaboration } from "./routes.mjs";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client");

export function createExpressApp(store) {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.use((req, res, next) => {
    res.setHeader("x-request-id", req.header("x-request-id") || crypto.randomUUID());
    next();
  });
  registerCollaboration(app, store);
  app.use(express.static(clientRoot));
  return app;
}
