import { handleInstallationCreated } from "@/webhooks/installation.created";
import { handleIssueComment } from "@/webhooks/issue_comment";
import { handlePullRequestClosed } from "@/webhooks/pull_request.closed";
import { handlePullRequestOpened } from "@/webhooks/pull_request.opened";
import { handlePullRequestReopened } from "@/webhooks/pull_request.reopened";
import { handlePullRequestSynchronize } from "@/webhooks/pull_request.synchronize";
import type { WebhookEventHandlerError } from "@octokit/webhooks/dist-types/types";
import dotenv from "dotenv";
import fs from "fs";
import { App } from "octokit";
import log from "./log";
import { handleInstallationRepositoriesAdded } from "./webhooks/installation_repositories.added";
import { handlePullRequestReview } from "./webhooks/pull_request_review";
import { handlePullRequestReviewComment } from "./webhooks/pull_request_review_comment";

dotenv.config();

function withCatch(handler) {
  return async (context) => {
    try {
      log.info(
        {
          repo: context.payload?.repository.full_name,
          event: context.name,
          action: context.payload?.action,
        },
        "Executing webhook handler"
      );
      const res = await handler(context);
      log.info(
        { event: context.name },
        "Webhook handler executed successfully"
      );
      return res;
    } catch (error: any) {
      log.error(
        {
          error: error.message,
          stack: error.stack,
          event: context.name,
          repo: context.payload.repository
            ? `${context.payload.repository.owner.login}/${context.payload.repository.name}`
            : "unknown",
        },
        `Error handling webhook ${context.name}`
      );
    }
  };
}

/**
 * startOctokit:
 *
 * @returns - octokit
 */
export const startGithubApp = () => {
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

  app.webhooks.on("installation.created", withCatch(handleInstallationCreated));
  app.webhooks.on(
    "installation_repositories.added",
    withCatch(handleInstallationRepositoriesAdded)
  );
  app.webhooks.on("pull_request.opened", withCatch(handlePullRequestOpened));
  app.webhooks.on("pull_request.closed", withCatch(handlePullRequestClosed));
  app.webhooks.on(
    "pull_request.synchronize",
    withCatch(handlePullRequestSynchronize)
  );
  app.webhooks.on(
    "pull_request.reopened",
    withCatch(handlePullRequestReopened)
  );
  app.webhooks.on("issue_comment", withCatch(handleIssueComment));
  app.webhooks.on(
    "pull_request_review.submitted",
    withCatch(handlePullRequestReview)
  );
  app.webhooks.on(
    "pull_request_review_comment",
    withCatch(handlePullRequestReviewComment)
  );

  // This logs any errors that occur.
  app.webhooks.onError((error: WebhookEventHandlerError) => {
    if (error.name === "AggregateError") {
      log.debug({ error: error.event }, `Error processing request`);
    } else {
      log.debug(error);
    }
  });
  return app;
};
