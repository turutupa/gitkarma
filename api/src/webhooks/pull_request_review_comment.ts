import db from "@/db/db";
import type { TRepo } from "@/db/models";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { PullRequestReviewCommentEvent } from "@octokit/webhooks-types";
import { gitkarmaEnabledOrThrow } from "./utils";

/**
 * handlePullRequestReview:
 *
 * This handler is invoked when a pull request review is submitted on GitHub.
 * - It persists the PR review in the local database (placeholder)
 * - It transfers funds to the reviewer as a reward for submitting a review
 *
 * @param {Object} params - An object containing the following properties:
 * @param {Octokit} params.octokit - An authenticated Octokit instance used to interact with the GitHub API.
 * @param {PullRequestReviewEvent} params.payload - The webhook payload for the pull request review event.
 *
 * @returns {Promise<void>} A promise that resolves when the handler has finished processing.
 */
export const handlePullRequestReviewComment = async ({
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestReviewCommentEvent;
}) => {
  const repoId = payload.repository.id;
  const reviewId = payload.comment.pull_request_review_id;
  const commentId = payload.comment.id.toString();
  const commentUrl = payload.comment.html_url;
  const commentBody = payload.comment.body || "";
  const commentPath = payload.comment.path || "";
  const commentPosition = payload.comment.position || -1;
  const commentLine = payload.comment.line || -1;
  const action = payload.action;

  const repo: TRepo = await db.getRepoByGithubRepoId(repoId);
  gitkarmaEnabledOrThrow(repo);

  // Only process when a review is submitted, not when edited or dismissed
  switch (action) {
    case "created":
      await db.createPullRequestReviewComment({
        reviewId: reviewId,
        commentId,
        url: commentUrl,
        body: commentBody,
        path: commentPath,
        position: commentPosition,
        line: commentLine,
      });
      log.info({ commentId }, "Review comment created");
      break;

    case "edited":
      await db.updatePullRequestReviewComment(commentId, {
        body: commentBody,
        path: commentPath,
        position: commentPosition,
        line: commentLine,
      });
      log.info({ commentId }, "Review comment updated");
      break;

    case "deleted":
      const deleted = await db.deletePullRequestReviewComment(commentId);
      if (deleted) {
        log.info({ commentId }, "Review comment deleted");
      } else {
        log.warn({ commentId }, "Review comment not found for deletion");
      }
      break;
  }
};
