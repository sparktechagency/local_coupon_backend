import { config } from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import {
  registerUserRoutes,
  registerAdminRoutes,
  registerRoutesThatNeedsRawBody,
} from "@routes/index";
import { startDB } from "src/db";
import logger from "@utils/logger";

// config
config();
const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));

app.use(logger);
registerRoutesThatNeedsRawBody(app);
app.use(express.json());
registerUserRoutes(app);
registerAdminRoutes(app);
// server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
server.setTimeout(60000); // 1 minute

startDB();
