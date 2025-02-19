import { createNodeMiddleware } from "@octokit/webhooks";
import dotenv from "dotenv";
import fs from "fs";
import http from "http";
import { App } from "octokit";
import { handleIssueComment } from "webhooks/issue_comment.ts";
import { handlePullRequestClosed } from "webhooks/pull_request.closed.ts";
import { handlePullRequestSynchronize } from "webhooks/pull_request.synchronize.ts";
import log from "./log.ts";
import { handlePullRequestOpened } from "./webhooks/pull_request.opened.ts";

dotenv.config();

const app = async () => {
  // This assigns the values of your environment variables to local variables.
  const appId = process.env.APP_ID || "";
  const webhookSecret = process.env.WEBHOOK_SECRET || "";
  const privateKeyPath = process.env.PRIVATE_KEY_PATH || "";

  // This reads the contents of your private key file.
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");

  // This creates a new instance of the Octokit App class.
  const app = new App({
    appId: appId,
    privateKey: privateKey,
    webhooks: {
      secret: webhookSecret,
    },
  });

  // Webhooks
  // This sets up a webhook event listener.
  //
  // Example. When your app receives a webhook event from GitHub with a `X-GitHub-Event`
  // header value of `pull_request` and an `action` payload value of `opened`,
  // it calls the `handlePullRequestOpened` event handler that is defined above.
  // @ts-ignore
  app.webhooks.on("pull_request.opened", handlePullRequestOpened);
  // @ts-ignore
  app.webhooks.on("pull_request.closed", handlePullRequestClosed);
  // @ts-ignore
  app.webhooks.on("pull_request.synchronize", handlePullRequestSynchronize);
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

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || "0.0.0.0";
  const path = "/api/webhook";
  const localWebhookUrl = `http://${host}:${port}${path}`;

  // This sets up a middleware function to handle incoming webhook events.
  // Octokit's `createNodeMiddleware` function takes care of generating this middleware function
  // for you. The resulting middleware function will:
  //    - Check the signature of the incoming webhook event to make sure that it matches your
  //      webhook secret. This verifies that the incoming webhook event is a valid GitHub event.
  //    - Parse the webhook event payload and identify the type of event.
  //    - Trigger the corresponding webhook event handler.
  const middleware = createNodeMiddleware(app.webhooks, { path });

  // This creates a Node.js server that listens for incoming HTTP requests
  // (including webhook payloads from GitHub) on the specified port. When
  // the server receives a request, it executes the `middleware` function that
  // you defined earlier. Once the server is running, it logs messages to
  // indicate that it is listening.
  http.createServer(middleware).listen(port, () => {
    log.info(`Server is listening for events at → ${localWebhookUrl}`);
    log.info("Press Ctrl + C to quit.");
  });
};

// LET's GO!
app();
