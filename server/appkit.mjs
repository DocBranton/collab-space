import { FilePersistence } from "./services/persistence.mjs";
import { registerCollaboration } from "./routes.mjs";

export function collaborationPlugin(store) {
  return {
    name: "collaboration",
    injectRoutes(router) {
      registerCollaboration(router, store);
    },
  };
}

export async function startAppKit(store, port) {
  const { createApp, server } = await import("@databricks/appkit");
  await createApp({
    plugins: [server({ port }), collaborationPlugin(store)],
  });
}

export async function openStore() {
  return FilePersistence.open(process.env.COLLAB_DATA_PATH || "/tmp/collab-space-data.json");
}
