import { createHttpApp } from "./server.js";

const PORT = Number(process.env.PORT || 3000);
const app = createHttpApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`K.K International Trade Assistant listening on port ${PORT}`);
});
