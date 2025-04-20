import { jwtMiddleware } from "@/middleware/jwt";
import { injectOctokit } from "@/middleware/octokit";
import { createInjectUserRepoMiddleware as injectUserRepoMiddleware } from "@/middleware/userRepo";
import { getUserRepos } from "@/routes/getUserRepos";
import { transferFunds } from "@/routes/transferFunds";
import { updateRepoSettings } from "@/routes/updateRepoSettings";
import { updateUserRepoRole } from "@/routes/updateUserRepoRole";
import { createNodeMiddleware } from "@octokit/webhooks";
import dotenv from "dotenv";
import express from "express";
import "express-async-errors";
import { startGithubApp } from "./githubApp";
import log from "./log";
import { errorHandler } from "./middleware/error";

dotenv.config();

/**
 * startApp
 * Initializes github application and express server.
 * - GitHub App is served on the /api/webhook endpoint.
 * - Express server is served on /api/* endpoint.
 * - Additional /api/health endpoint for health checks.
 */
const startApp = async () => {
  const port = process.env.PORT || 4000;
  const host = process.env.HOST || "0.0.0.0";

  // create express app!
  const app = express();

  // add octokit router
  const octokitApp = startGithubApp();
  const webhookPath = "/api/webhook";
  const octokitMiddleware = createNodeMiddleware(octokitApp.webhooks, {
    path: webhookPath,
  });
  // @ts-ignore
  app.use(octokitMiddleware);

  app.get("/api/health", (req, res) => {
    console.log(`Health check from ${req.ip} - ${req.get("User-Agent")}`);
    res.json({ status: "ok", message: "Server is running" });
  });

  // Create a router for routes
  const routes = express.Router();
  // inject middlewares
  routes.use(express.json());
  routes.use(jwtMiddleware);
  routes.use(injectUserRepoMiddleware);
  routes.use(injectOctokit);

  // set routes
  routes.get("/api/repos", getUserRepos);
  routes.put("/api/repos/settings", updateRepoSettings);
  routes.put("/api/repos/roles", updateUserRepoRole);
  routes.post("/api/funds", transferFunds);

  // error handling middleware
  routes.use(errorHandler);

  // register routes
  app.use(routes);

  // Start the server
  app.listen(port, () => {
    log.info(`Server is listening on http://${host}:${port}`);
    log.info("Press Ctrl + C to quit.");
  });
};

// LET's GO!
startApp();
