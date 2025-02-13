import { config } from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";

// config
config();
const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());
// config

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
server.setTimeout(60000); // 1 minute

app.get("/", (req, res) => {
  res.send("Express + TypeScript Server");
});
