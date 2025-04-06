import { jwtMiddleware } from "@/middleware/jwt";
import { injectOctokit } from "@/middleware/octokit";
import { createInjectUserRepoMiddleware as injectUserRepoMiddleware } from "@/middleware/userRepo";
import { getUserRepos } from "@/routes/getUserRepos";
import { transferFunds } from "@/routes/transferFunds";
import { updateRepoSettings } from "@/routes/updateRepoSettings";
import { updateUserRepoRole } from "@/routes/updateUserRepoRole";
import { handleInstallationCreated } from "@/webhooks/installation.created";
import { handleIssueComment } from "@/webhooks/issue_comment";
import { handlePullRequestClosed } from "@/webhooks/pull_request.closed";
import { handlePullRequestOpened } from "@/webhooks/pull_request.opened";
import { handlePullRequestReopened } from "@/webhooks/pull_request.reopened";
import { handlePullRequestSynchronize } from "@/webhooks/pull_request.synchronize";
import { createNodeMiddleware } from "@octokit/webhooks";
import type { WebhookEventHandlerError } from "@octokit/webhooks/dist-types/types";
import dotenv from "dotenv";
import express from "express";
import "express-async-errors";
import fs from "fs";
import { App } from "octokit";
import log from "./log";

dotenv.config();

/**
 * startOctokit:
 *
 * @returns - octokit
 */
const startOctokit = () => {
  const appId = process.env.APP_ID || "";
  const webhookSecret = process.env.WEBHOOK_SECRET || "";
  const privateKeyPath = process.env.PRIVATE_KEY_PATH || "";
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  const app = new App({
    appId: appId,
    privateKey: privateKey,
    webhooks: {
      secret: webhookSecret,
    },
  });
  // @ts-ignore
  app.webhooks.on("installation.created", handleInstallationCreated);
  // @ts-ignore
  app.webhooks.on("pull_request.opened", handlePullRequestOpened);
  // @ts-ignore
  app.webhooks.on("pull_request.closed", handlePullRequestClosed);
  app.webhooks.on(
    "pull_request.synchronize",
    // @ts-ignore
    handlePullRequestSynchronize
  );
  // @ts-ignore
  app.webhooks.on("pull_request.reopened", handlePullRequestReopened);
  // @ts-ignore
  app.webhooks.on("issue_comment", handleIssueComment);

  // This logs any errors that occur.
  app.webhooks.onError((error: WebhookEventHandlerError) => {
    // @ts-ignore
    if (error.name === "AggregateError") {
      log.debug({ error: error.event }, `Error processing request`);
    } else {
      log.debug(error);
    }
  });
  return app;
};

/**
 * startApp:
 *
 */
const startApp = async () => {
  const port = process.env.PORT || 4000;
  const host = process.env.HOST || "0.0.0.0";

  // create express app!
  const app = express();

  // add octokit router
  const octokitApp = startOctokit();
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
  routes.use(express.json());
  routes.use(jwtMiddleware);
  routes.use(injectUserRepoMiddleware);
  routes.use(injectOctokit);

  routes.get("/api/repos", getUserRepos);
  routes.put("/api/repos/settings", updateRepoSettings);
  routes.put("/api/repos/roles", updateUserRepoRole);
  routes.post("/api/funds", transferFunds);

  // routes.use((err, req, res, next) => {
  //   log.error({ err, url: req.url }, "Unhandled error in route");
  //   res.status(500).json({ error: err ?? "Internal server error" });
  // });

  app.use(routes);

  // Start the server
  app.listen(port, () => {
    log.info(`Server is listening on http://${host}:${port}`);
    log.info("Press Ctrl + C to quit.");
  });
};

// LET's GO!
startApp();
