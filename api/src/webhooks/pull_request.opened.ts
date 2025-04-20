import db from "@/db/db";
import type { TRepo } from "@/db/models";
import tb from "@/db/tigerbeetle";
import log from "@/log";
import {
  EGithubEndpoints,
  EPullRequestState,
  githubHeaders,
  GITKARMA_CHECK_NAME,
} from "@/webhooks/constants";
import { Octokit } from "@octokit/rest";
import type { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { checks, comments } from "./messages";
import {
  getOrDefaultGithubRepo,
  getOrDefaultGithubUser,
  gitkarmaEnabledOrThrow,
} from "./utils";

/**
 * handlePullRequestOpened:
 *
 * This handler is invoked when a pull request is opened on GitHub.
 *
 * - Checks the user's token balance against the required tokens for merging the PR.
 * - Creates a new pull request entry in the local database with:
 *   - The PR number and repository ID.
 *   - The head SHA of the PR.
 *   - The PR state set to "open".
 *   - The check status flag set based on whether the user has enough tokens.
 * - If the user has sufficient tokens:
 *   - Charges the user's account by transferring the PR merge deduction tokens.
 *   - Posts a comment to the PR with the updated balance.
 *   - Updates the GitKarma check to "completed" with a "success" conclusion.
 * - If the user does not have enough tokens:
 *   - Posts a comment to the PR indicating insufficient tokens.
 *   - Updates the GitKarma check to "completed" with a "failure" conclusion.
 *
 * @param {Object} params - The parameters for the handler.
 * @param {Octokit} params.octokit - An authenticated Octokit instance for GitHub API interactions.
 * @param {PullRequestOpenedEvent} params.payload - The webhook payload for the pull request opened event.
 * @returns {Promise<void>} A promise that resolves when processing is complete.
 */
export const handlePullRequestOpened = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestOpenedEvent;
}) => {
  const prNumber = payload.number;
  const headSha = payload.pull_request.head.sha;
  const owner = payload.repository.owner.login; // GitHub repo owner
  const repoName = payload.repository.name; // GitHub repo name
  const repoId = payload.repository.id; // GitHub ID
  const githubUserId = payload.pull_request.user.id; // GitHub user id
  const githubUsername = payload.pull_request.user.login; // GitHub user login name

  const repo: TRepo = await getOrDefaultGithubRepo(repoId, repoName, owner);
  gitkarmaEnabledOrThrow(repo);

  // set remote pull request check to in progress
  await octokit.rest.checks.create({
    owner,
    repo: repoName,
    name: GITKARMA_CHECK_NAME,
    head_sha: headSha,
    status: "in_progress",
    output: {
      title: checks.inProgress.title,
      summary: checks.inProgress.summary(githubUsername, repo.merge_penalty),
    },
  });

  const { user, account } = await getOrDefaultGithubUser(
    repo,
    githubUserId,
    githubUsername
  );

  log.info({ user }, "pull_request.opened > user");
  log.info({ account }, "pull_request.opened > user account");

  const balance = Number(tb.getBalance(account));
  const hasEnoughDebits = balance >= repo.merge_penalty;

  // Create pull request entry with user assigned as owner
  await db.createPullRequest(
    prNumber,
    repo.id,
    user.id,
    headSha,
    EPullRequestState.Open,
    hasEnoughDebits // set PR to passed/not passed check
  );

  // handle pr payment and notify github
  if (hasEnoughDebits) {
    await tb.repoChargesFundsToUser(
      BigInt(repo.tigerbeetle_account_id),
      BigInt(account.id),
      BigInt(repo.merge_penalty),
      repo.id
    );
    const newBalance = balance - repo.merge_penalty;
    await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: comments.pullRequestFundedMessage(
        githubUsername,
        newBalance,
        repo.trigger_recheck_text,
        repo.admin_trigger_recheck_text
      ),
      headers: githubHeaders,
    });

    await octokit.rest.checks.create({
      owner,
      repo: repoName,
      name: GITKARMA_CHECK_NAME,
      head_sha: headSha,
      status: "completed",
      conclusion: "success",
      output: {
        title: checks.completed.title,
        summary: checks.completed.summary(
          githubUsername,
          balance,
          newBalance,
          repo.merge_penalty
        ),
      },
    });
    return;
  }

  // send error comment because not enough debits
  await octokit.request(EGithubEndpoints.Comments, {
    owner,
    repo: repoName,
    issue_number: prNumber,
    body: comments.pullRequestNotEnoughFundsMessage(
      githubUsername,
      balance,
      repo.merge_penalty,
      repo.trigger_recheck_text,
      repo.admin_trigger_recheck_text
    ),
    headers: githubHeaders,
  });

  // complete check with failure
  await octokit.rest.checks.create({
    owner,
    repo: repoName,
    name: GITKARMA_CHECK_NAME,
    head_sha: headSha,
    status: "completed",
    conclusion: "failure",
    output: {
      title: checks.failed.title,
      summary: checks.failed.summary(
        githubUsername,
        balance,
        repo.merge_penalty
      ),
    },
  });
};
