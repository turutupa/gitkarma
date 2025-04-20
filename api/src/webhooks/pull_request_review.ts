import db from "@/db/db";
import type { TRepo } from "@/db/models";
import tb from "@/db/tigerbeetle";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { PullRequestReviewEvent } from "@octokit/webhooks-types";
import { EGithubEndpoints, githubHeaders } from "./constants";
import { comments } from "./messages";
import { getOrDefaultGithubUser, gitkarmaEnabledOrThrow } from "./utils";

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
  // Only process when a review is submitted, not when edited or dismissed
  if (payload.action !== "submitted") {
    log.debug(
      { action: payload.action },
      "Ignoring pull request review action that is not 'submitted'"
    );
    return;
  }

  const owner = payload.repository.owner.login; // GitHub repo owner
  const prNumber = payload.pull_request.number;
  const repoId = payload.repository.id; // GitHub ID
  const repoName = payload.repository.name; // GitHub repo name
  const reviewerGithubId = payload.review.user.id; // GitHub user id
  const reviewerGithubName = payload.review.user.login; // GitHub username
  const reviewState = payload.review.state;

  const repo: TRepo = await db.getRepoByGithubRepoId(repoId);
  gitkarmaEnabledOrThrow(repo);

  // Get reviewer account
  const { account, user } = await getOrDefaultGithubUser(
    repo,
    reviewerGithubId,
    reviewerGithubName
  );

  // Persist the PR review in the database
  const pr = await db.getPullRequest(prNumber, repo.id);
  if (!pr) {
    log.error(
      { pr: prNumber, repoId },
      "Pull request not found in the database"
    );
    return;
  }
  await db.createPullRequestReview({
    pr_number: prNumber,
    repoId: repo.id,
    reviewerId: user.id,
    state: reviewState,
    reviewId: payload.review.id?.toString(),
    body: payload.review.body || "",
    commitId: payload.review.commit_id,
  });

  log.debug(
    {
      repo,
      pr: prNumber,
      reviewer: { id: reviewerGithubId, name: reviewerGithubName },
      state: reviewState,
    },
    "Persisted pull request review, transferring funds to reviewer"
  );

  // Transfer review bonus to the reviewer
  await tb.repoTransfersFundsToUser(
    BigInt(repo.tigerbeetle_account_id),
    BigInt(account.id),
    BigInt(repo.review_bonus),
    repo.id
  );

  // Send com ment to the PR
  await octokit.request(EGithubEndpoints.Comments, {
    owner,
    repo: repoName,
    issue_number: prNumber,
    body: comments.pullRequestReviewSubmitted(
      user.github_username,
      repo.review_bonus
    ),
    headers: githubHeaders,
  });
};
