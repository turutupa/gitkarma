import db from "@/db/db";
import type { TRepo } from "@/db/models";
import tb from "@/db/tigerbeetle";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { PullRequestReviewEvent } from "@octokit/webhooks-types";
import {
  EActivityLogAction,
  EActivityLogEvent,
  EGithubEndpoints,
  githubHeaders,
} from "./constants";
import { comments } from "./messages";
import { getOrDefaultGithubUser, gitkarmaEnabledOrThrow, isBot } from "./utils";

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
export const handlePullRequestReview = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestReviewEvent;
}) => {
  const owner = payload.repository.owner.login; // GitHub repo owner
  const prNumber = payload.pull_request.number;
  const repoId = payload.repository.id;
  const repoName = payload.repository.name;
  const reviewerGithubId = payload.review.user.id;
  const reviewerGithubName = payload.review.user.login;
  const reviewerGithubUrl = payload.review.user.html_url;
  const reviewState = payload.review.state;
  const reviewUrl = payload.review.html_url;

  if (isBot(payload)) {
    return;
  }

  const repo: TRepo = await db.getRepoByGithubRepoId(repoId);
  gitkarmaEnabledOrThrow(repo);

  // Get reviewer account
  const { account, user } = await getOrDefaultGithubUser(
    repo,
    reviewerGithubId,
    reviewerGithubName,
    reviewerGithubUrl
  );

  const pr = await db.getPullRequest(prNumber, repo.id);
  if (!pr) {
    log.error(
      { pr: prNumber, repoId },
      "Pull request not found in the database"
    );
    return;
  }

  const state = payload.review.state;
  if (state === "dismissed") {
    log.info("Ignoring pull request review, review dismissed");
  }

  // Only process when a review is submitted, not when edited or dismissed
  if (payload.action !== "submitted") {
    log.debug(
      { action: payload.action },
      "Ignoring pull request review action that is not 'submitted'"
    );
    return;
  }

  await db.createPullRequestReview({
    pr_number: prNumber,
    repoId: repo.id,
    reviewerId: user.id,
    url: reviewUrl,
    state: reviewState,
    reviewId: payload.review.id?.toString(),
    body: payload.review.body || "",
    commitId: payload.review.commit_id,
  });

  let totalBonus = repo.review_bonus;
  let timelyReviewBonus = 0;
  let bountyBonus = 0;

  const reviewSubmittedAtStr = payload.review.submitted_at;
  const prCreatedAtStr = payload.pull_request.created_at;
  if (reviewSubmittedAtStr && prCreatedAtStr) {
    const prReviewSubmittedAt = new Date(reviewSubmittedAtStr);
    const prCreatedAt = new Date(prCreatedAtStr);
    const hourInMs = 60 * 60 * 1000;
    const timeSincePrCreated =
      prReviewSubmittedAt.getTime() - prCreatedAt.getTime();
    if (
      repo.timely_review_bonus_enabled &&
      timeSincePrCreated <= repo.timely_review_bonus_hours * hourInMs
    ) {
      totalBonus += repo.timely_review_bonus;
      timelyReviewBonus = repo.timely_review_bonus;
    }
  }

  // Check if there is a bounty on the pull request
  if (pr.bounty) {
    bountyBonus = pr.bounty;
    totalBonus += bountyBonus;

    // Update the pull request to set the bounty to null
    await db.updatePullRequest(prNumber, repo.id, { bounty: null });

    // Remove the bounty label
    try {
      await octokit.rest.issues.removeLabel({
        owner,
        repo: repoName,
        issue_number: prNumber,
        name: `bounty: ${bountyBonus} karma`,
      });
    } catch (error: any) {
      if (error.status !== 404) {
        throw error; // Re-throw other errors
      }
    }

    log.info(
      `Bounty of ${bountyBonus} karma points claimed for PR #${prNumber}`
    );
  }

  log.info(
    {
      repo,
      pr: prNumber,
      reviewer: { id: reviewerGithubId, name: reviewerGithubName },
      state: reviewState,
      totalBonus,
    },
    "Persisted pull request review, transferring funds to reviewer"
  );

  // Transfer review bonus (including timely review bonus and bounty if applicable) to the reviewer
  await tb.repoTransfersFundsToUser(
    BigInt(repo.tigerbeetle_account_id),
    BigInt(account.id),
    BigInt(totalBonus),
    repo.id
  );

  // Send comment to the PR
  const submittedReviewComment = await octokit.request(
    EGithubEndpoints.Comments,
    {
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: comments.pullRequestReviewSubmittedMessage(
        user.github_username,
        totalBonus,
        timelyReviewBonus,
        bountyBonus
      ),
      headers: githubHeaders,
    }
  );

  // activity log - transfer funds to reviewer
  await db.createActivityLog(
    repo.id,
    pr.id,
    user.id,
    EActivityLogEvent.Review,
    reviewState,
    submittedReviewComment.data.html_url,
    EActivityLogAction.Received,
    totalBonus
  );
};
