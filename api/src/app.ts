import { createNodeMiddleware } from "@octokit/webhooks";
import dotenv from "dotenv";
import express from "express";
import "express-async-errors";
import { startGithubApp } from "./githubApp";
import log from "./log";
import routes from "./routes";

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

  // dummy health check endpoint
  app.get("/api/health", (req, res) => {
    console.log(`Health check from ${req.ip} - ${req.get("User-Agent")}`);
    const uptimeInMinutes = Math.floor(process.uptime() / 60);
    const hours = Math.floor(uptimeInMinutes / 60);
    const minutes = uptimeInMinutes % 60;
    const seconds = Math.floor(process.uptime() % 60);
    const uptime = `${hours}:${minutes}:${seconds}`;
    res.json({ status: "ok", message: "Server is running", uptime });
  });

  // register routes
  app.use(routes("/api"));

  // Start the server
  app.listen(port, () => {
    log.info(`Server is listening on http://${host}:${port}`);
    log.info("Press Ctrl + C to quit.");
  });
};

// LET's GO!
startApp();
