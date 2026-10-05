import { createCollaborationApp } from "./app.mjs";
import { FilePersistence } from "./services/persistence.mjs";

const port = Number(process.env.DATABRICKS_APP_PORT || process.env.PORT || 8000);
const store = await FilePersistence.open(process.env.COLLAB_DATA_PATH || "/tmp/collab-space-data.json");
createCollaborationApp({ store }).listen(port, "0.0.0.0", () => {
  console.log(`Collaboration Space listening on ${port}`);
});
