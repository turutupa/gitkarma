import { jwtMiddleware } from "@/middleware/jwt";
import { createInjectOctokit } from "@/middleware/octokit";
import { createInjectUserRepoMiddleware as injectUserRepoMiddleware } from "@/middleware/userRepo";
import { repoSettings } from "@/routes/repoSettings";
import { transferFunds } from "@/routes/transferFunds";
import { userRepos } from "@/routes/userRepos";
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
  const octokit = startOctokit();
  const webhookPath = "/api/webhook";
  const octokitMiddleware = createNodeMiddleware(octokit.webhooks, {
    path: webhookPath,
  });
  // @ts-ignore
  app.use(octokitMiddleware);

  // Create shared middleware injecting the octokit instance.
  // @ts-ignore
  const injectOctokitMiddleware = createInjectOctokit(octokit);

  app.get("/api/health", (req, res) => {
    console.log(`Health check from ${req.ip} - ${req.get("User-Agent")}`);
    res.json({ status: "ok", message: "Server is running" });
  });

  // Create a router for routes
  const routes = express.Router();
  routes.use(express.json());
  routes.use(injectOctokitMiddleware);
  routes.use(jwtMiddleware);
  routes.use(injectUserRepoMiddleware);

  routes.get("/api/repos", userRepos);
  routes.put("/api/repos", repoSettings);
  routes.post("/api/funds", transferFunds);

  app.use(routes);

  // Start the server
  app.listen(port, () => {
    log.info(`Server is listening on http://${host}:${port}`);
    log.info("Press Ctrl + C to quit.");
  });
};

// LET's GO!
startApp();
