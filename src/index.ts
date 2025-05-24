import { config } from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import {
  registerUserRoutes,
  registerAdminRoutes,
  registerRoutesThatNeedsRawBody,
} from "@routes/index";
import { startDB } from "@db";
import logger from "@utils/logger";
import "@services/notificationService";

// config
config();
const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));

registerRoutesThatNeedsRawBody(app);
app.use(express.json({ limit: "20mb" }));
app.use(logger);
registerUserRoutes(app);
registerAdminRoutes(app);
// server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
server.setTimeout(60000); // 1 minute

startDB();
