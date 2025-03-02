import { createNodeMiddleware } from "@octokit/webhooks";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import { jwtMiddleware } from "middleware/jwt.ts";
import { createInjectOctokit } from "middleware/octokit.ts";
import { createInjectUserRepo } from "middleware/userRepo.ts";
import { App } from "octokit";
import { transferFunds } from "routes/transferFunds.ts";
import { userRepos } from "routes/userRepos.ts";
import { handleInstallationCreated } from "webhooks/installation.created.ts";
import { handleIssueComment } from "webhooks/issue_comment.ts";
import { handlePullRequestClosed } from "webhooks/pull_request.closed.ts";
import { handlePullRequestOpened } from "webhooks/pull_request.opened.ts";
import { handlePullRequestReopened } from "webhooks/pull_request.reopened.ts";
import { handlePullRequestSynchronize } from "webhooks/pull_request.synchronize.ts";
import log from "./log.ts";

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
  app.webhooks.onError((error) => {
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
  const octokit = startOctokit();
  const webhookPath = "/api/webhook";
  const octokitMiddleware = createNodeMiddleware(octokit.webhooks, {
    path: webhookPath,
  });

  // Create shared middleware injecting the octokit instance.
  // @ts-ignore
  const injectOctokit = createInjectOctokit(octokit);

  const app = express();

  app.use(express.json());
  // @ts-ignore
  app.use(octokitMiddleware);
  app.use(injectOctokit);
  app.use(jwtMiddleware);
  app.use(createInjectUserRepo);

  app.get("/", (_, res) => {
    res.json("hello world");
  });
  app.get("/api/repos", userRepos);
  app.post("/api/funds", transferFunds);

  // Start the server
  app.listen(port, () => {
    log.info(`Server is listening on http://${host}:${port}`);
    log.info("Press Ctrl + C to quit.");
  });
};

// LET's GO!
startApp();
