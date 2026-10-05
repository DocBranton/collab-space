import { createExpressApp } from "./expressApp.mjs";
import { openStore, startAppKit } from "./appkit.mjs";

const port = Number(process.env.DATABRICKS_APP_PORT || process.env.PORT || 8000);
const store = await openStore();

if (process.env.COLLAB_USE_APPKIT === "1") {
  await startAppKit(store, port);
} else {
  createExpressApp(store).listen(port, "0.0.0.0", () => {
    console.log(`Collaboration Space listening on ${port}`);
  });
}
